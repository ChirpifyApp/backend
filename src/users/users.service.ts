import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { encryptPassword } from 'src/utils';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
	constructor(private prisma: PrismaService) {}

	async findOneByEmail(email: string): Promise<User> {
		return this.prisma.user.findUnique({ where: { email } });
	}

	async findOneById(id: number): Promise<User> {
		return this.prisma.user.findUnique({ where: { id } });
	}

	async updateUser(user: User, data: UpdateUserDto) {
		if (!user.discordUid) {
			// Regular user
			if (data.newPassword) {
				if ((await encryptPassword(data.password)) != user.password) {
					throw new UnauthorizedException('Invalid password');
				}
				data.password = await encryptPassword(data.newPassword);
			}
		}
		const { newPassword, ...rest } = data; // Remove newPassword from prisma update
		return await this.prisma.user.update({
			where: {
				id: user.id,
			},
			data: rest,
		});
	}

	async verifyUser(id: string, code: string) {
		const registerCode = await this.prisma.registerCode.findFirst({ where: { id: id } });

		if (!registerCode || registerCode === null) {
			throw new NotFoundException('Code does not exist');
		}

		if (registerCode.used) {
			throw new UnauthorizedException('Code already used');
		}

		if (registerCode.code !== code) {
			throw new BadRequestException('Invalid code');
		}

		await this.prisma.user.update({
			where: {
				id: registerCode.userId,
			},
			data: {
				active: true,
			},
		});

		await this.prisma.registerCode.update({
			where: {
				id: registerCode.id,
			},
			data: {
				used: true,
			},
		});

		return await this.prisma.user.findUnique({ where: { id: registerCode.userId } });
	}
}
