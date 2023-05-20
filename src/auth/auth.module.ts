import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DiscordStrategy } from './strategy/discord.strategy';
import { JwtStrategy } from './strategy/jwt.strategy';
import { UsersService } from 'src/users/users.service';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [PassportModule, JwtModule.register({
    global: true,
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '1d' }
  }), PrismaModule, MailModule, forwardRef(() => UsersModule)],
  controllers: [AuthController],
  providers: [AuthService, DiscordStrategy, JwtStrategy],
  exports: [AuthService]
})
export class AuthModule { }
