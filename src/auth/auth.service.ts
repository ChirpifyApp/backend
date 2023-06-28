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

	async createJwtToken(email: string, uid: number) {
		const payload = { email: email, uid: uid };
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
		return await this.createJwtToken(user.email, user.id);
	}

	async checkRegisterLimitations(registerUserDto: RegisterUserDto) {
		const user = await this.usersService.findOneByEmail(registerUserDto.email);
		if (user) {
			throw new ConflictException('Email address already in use');
		}
	}

	async checkPasswordRequirements(registerUserDto: RegisterUserDto) {
		const regex = /^(?=.*[a-zA-Z!@#$%^&*])(?=.*\d).{8,}$/;
		if (!regex.test(registerUserDto.password)) {
			throw new BadRequestException('Password requirements not met.');
		}
	}

	async register(registerUserDto: RegisterUserDto, discord = false) {
		if (!discord) await this.checkPasswordRequirements(registerUserDto);
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
}
