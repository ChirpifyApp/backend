import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Module({
	providers: [MailService],
	exports: [MailService],
	imports: [
		PrismaModule,
		MailerModule.forRoot({
			transport: {
				host: process.env.SMTP_HOST,
				port: parseInt(process.env.SMTP_PORT),
				secure: true,
				auth: {
					user: process.env.SMTP_USER,
					pass: process.env.SMTP_PASS,
				},
			},
			defaults: {
				from: 'Chirpify <noreply@chirpify.xyz>',
			},
			template: {
				dir: __dirname + '/templates',
				adapter: new HandlebarsAdapter(),
				options: {
					strict: true,
				},
			},
		}),
	],
})
export class MailModule {}
