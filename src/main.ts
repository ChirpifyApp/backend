import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as morgan from 'morgan';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chalk = require('chalk');
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.use(
		morgan(function (tokens, req, res) {
			return (
				chalk.gray(new Date().toISOString()) +
				' ' +
				chalk.blue(tokens['remote-addr'](req, res)) +
				' ' +
				chalk.cyanBright(tokens.method(req, res)) +
				' ' +
				chalk.green(tokens.url(req, res)) +
				' ' +
				chalk.magentaBright(tokens.status(req, res)) +
				' ' +
				chalk.red(tokens['response-time'](req, res) + 'ms')
			);
		}),
	);

	app.enableCors({
		origin: ['http://localhost:3000', 'http://localhost:5173', 'https://chirpify.xyz'],
		credentials: true,
	});

	const config = new DocumentBuilder()
		.setTitle('Chirpify NestJS API')
		.setDescription('The Chirpify API description')
		.setVersion('0.1.0')
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api', app, document);

	app.getHttpAdapter().getInstance().set('etag', false);
	app.use(cookieParser());
	app.useGlobalPipes(new ValidationPipe());

	/* let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }); */

	await app.listen(3000);
}

bootstrap();
