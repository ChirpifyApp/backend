import { Injectable } from '@nestjs/common';
import { RegisterCode } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

const nodemailer = require('nodemailer');

@Injectable()
export class MailService {
	private transporter;

	constructor(private prisma: PrismaService) {
		this.transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: process.env.SMTP_PORT,
			secure: true,
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS,
			},
		});
	}

	async sendRegistrationCode(code: RegisterCode) {
		return await this.transporter.sendMail({
			from: 'Chirpify <noreply@chirpify.xyz>',
			to: await this.prisma.user.findFirst({ where: { id: code.userId } }).then((user) => user.email),
			subject: 'Chirpify registration',
			text: `Your registration link is ${process.env.FRONTEND_URL}/verify/${code.id}?code=${code.code}\nor use code ${code.code} on the verification page`,
		});
	}
}
