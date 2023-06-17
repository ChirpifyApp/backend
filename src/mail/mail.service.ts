import { Injectable } from '@nestjs/common';
import { RegisterCode } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
	constructor(private prisma: PrismaService, private mailerService: MailerService) {}

	async sendRegistrationCode(code: RegisterCode) {
		return await this.mailerService.sendMail({
			to: await this.prisma.user.findFirst({ where: { id: code.userId } }).then((user) => user.email),
			subject: 'Chirpify registration',
			template: './confirmation',
			context: {
				code: code.code,
				url: `${process.env.FRONTEND_URL}/verify/${code.id}?code=${code.code}`,
			},
		});
	}
}
