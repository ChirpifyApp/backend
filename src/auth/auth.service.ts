import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { log } from 'console';
import { MailService } from 'src/mail/mail.service';

import { PrismaService } from 'src/prisma/prisma.service';
import { LoginUserDto } from 'src/users/dto/login-user.dto';
import { RegisterUserDto } from 'src/users/dto/register-user.dto';
import { UsersService } from 'src/users/users.service';
import { encryptPassword } from 'src/utils';
import { ResetPasswordDto } from '../users/dto/reset-password.dto';
import { RequestResetPasswordDto } from '../users/dto/request-reset-password.dto';

@Injectable()
export class AuthService {
	constructor(
		private usersService: UsersService,
		private jwtService: JwtService,
		private prisma: PrismaService,
		private mail: MailService,
	) {}

	async getUser(userId: number) {
		return await this.usersService.findOneById(userId);
	}

	async getValidation(userId: number, password: string) {
		return await this.usersService.findOneByIdAndPassword(userId, password);
	}

	async createJwtToken(email: string, uid: number, password: string) {
		const payload = { email: email, uid: uid, password: password };
		return {
			jwt: await this.jwtService.signAsync(payload, { expiresIn: '1d' }),
		};
	}

	async signIn(loginUserDto: LoginUserDto) {
		const user = await this.usersService.findOneByEmail(loginUserDto.email);
		if (!user) {
			throw new UnauthorizedException();
		}
		if (!user?.active) {
			throw new ForbiddenException('User is not verified.');
		}
		if (user?.password != (await encryptPassword(loginUserDto.password))) {
			throw new UnauthorizedException();
		}
		return await this.createJwtToken(user.email, user.id, user.password);
	}

	async checkRegisterLimitations(registerUserDto: RegisterUserDto) {
		const user = await this.usersService.findOneByEmail(registerUserDto.email);
		if (user) {
			throw new ConflictException('Email address already in use');
		}
	}

	async checkPasswordRequirements(password: string) {
		const regex = /^(?=.*[a-zA-Z!@#$%^&*])(?=.*\d).{8,}$/;
		if (!regex.test(password)) {
			throw new BadRequestException('Password requirements not met.');
		}
	}

	async register(registerUserDto: RegisterUserDto, discord = false) {
		if (!discord) await this.checkPasswordRequirements(registerUserDto.password);
		if (registerUserDto.password) registerUserDto.password = await encryptPassword(registerUserDto.password);

		await this.checkRegisterLimitations(registerUserDto);
		const { password, discordUid, registerCodeId, ...user } = await this.prisma.user.create({
			data: registerUserDto,
		});
		if (!discord) {
			const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
			const code = await this.prisma.registerCode.create({
				data: {
					userId: user.id,
					code: verificationCode,
				},
			});
			this.mail.sendRegistrationCode(code); // let's not wait
			await this.prisma.user.update({
				where: { id: user.id },
				data: { registerCodeId: code.id },
			});
			return {
				user,
				code: code.id,
			};
		} else {
			// Discord account
			await this.prisma.user.update({
				where: { id: user.id },
				data: { active: true },
			});
		}
		return user;
	}

	async discordSignIn(user: User) {
		const payload = { email: user.email, uid: user.id };
		return await this.jwtService.signAsync(payload, {
			expiresIn: '1d',
		});
	}

	async validateDiscordUser(profile: any) {
		log('validateDiscordUser', profile);
		// Customize this method to retrieve or create a user in your app's database based on the Discord profile
		let user: any = await this.usersService.findOneByEmail(profile.email);
		if (!user) {
			console.log('User not found by Discord email, creating new...');
			user = (await this.register(
				{
					email: profile.email,
					discordUid: profile.id,
					name: profile.username,
				},
				true,
			)) as any;
		} else {
			console.log('User found by Discord email, updating...');
			user = (await this.usersService.updateUser(user, {
				name: profile.username,
			})) as any;
		}
		return user;
	}

	async sendResetPasswordEmail(requestResetPasswordDto: RequestResetPasswordDto) {
		const user = await this.prisma.user.findFirst({
			where: { email: requestResetPasswordDto.email },
		});
		if (!user) {
			throw new BadRequestException('User not found.');
		}
		if (!user.active) {
			throw new ForbiddenException('User is not verified.');
		}
		// Set all active to inactive
		await this.prisma.resetPasswordCode.updateMany({
			data: {
				active: false,
			},
			where: {
				userId: user.id,
				active: true,
			},
		});

		const code = await this.prisma.resetPasswordCode.create({
			data: {
				expiryDate: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
				userId: user.id,
			},
		});

		this.mail.sendResetPasswordCode(code); // let's not wait
		const { password, registerCodeId, ...userWithoutPassword } = user;
		return userWithoutPassword;
	}

	async resetPassword(resetPasswordDto: ResetPasswordDto) {
		if (resetPasswordDto.password != resetPasswordDto.confirmPassword) {
			throw new BadRequestException('Passwords do not match.');
		}
		await this.checkPasswordRequirements(resetPasswordDto.password);
		const code = await this.prisma.resetPasswordCode.findFirst({
			where: {
				id: resetPasswordDto.code,
				active: true,
			},
		});
		if (!code) {
			throw new BadRequestException('Invalid code.');
		}
		if (code.expiryDate < new Date()) {
			throw new BadRequestException('Code expired.');
		}
		const user = await this.prisma.user.findFirst({
			where: {
				id: code.userId,
			},
		});
		if (!user) {
			throw new BadRequestException('User not found.');
		}

		await this.prisma.user.update({
			where: {
				id: user.id,
			},
			data: {
				password: await encryptPassword(resetPasswordDto.password),
			},
		});

		await this.prisma.resetPasswordCode.update({
			where: {
				id: code.id,
			},
			data: {
				active: false,
			},
		});
		const { password, registerCodeId, ...userWithoutPassword } = user;
		return userWithoutPassword;
	}
}
