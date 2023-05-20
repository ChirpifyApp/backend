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
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendRegistrationCode(code: RegisterCode) {
        return await this.transporter.sendMail({
            from: 'Chirpify <jakub@bordas.sk>',
            to: await this.prisma.user.findFirst({where: {id: code.userId}}).then(user => user.email),
            subject: 'Chirpify registration',
            text: `Your registration code is ${process.env.HOST_URL}/users/verify/${code.id}`,
        })
    }

}
