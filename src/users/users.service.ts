import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { encryptPassword } from 'src/utils';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

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
                if (await encryptPassword(data.password) != user.password) {
                    throw new UnauthorizedException("Invalid password");
                }
                data.password = await encryptPassword(data.newPassword);
            }
        }
        const { newPassword, ...rest } = data; // Remove newPassword from prisma update
        return await this.prisma.user.update({
            where: {
                id: user.id
            },
            data: rest
        });
    }

    async verifyUser(code: string) {
        let registerCode = await this.prisma.registerCode.findFirst({ where: { id: code } });

        if (!registerCode || registerCode === null) {
            throw new NotFoundException("Invalid code");
        }

        if (registerCode.used) {
            throw new UnauthorizedException("Code already used");
        }

        await this.prisma.user.update({
            where: {
                id: registerCode.userId
            },
            data: {
                active: true
            }
        });

        return await this.prisma.registerCode.update({
            where: {
                id: registerCode.id
            },
            data: {
                used: true
            }
        });
    }

}
