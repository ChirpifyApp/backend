import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthService } from 'src/auth/auth.service';
import { AuthModule } from 'src/auth/auth.module';
import { UsersController } from './users.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtStrategy } from 'src/auth/strategy/jwt.strategy';

@Module({
	providers: [UsersService, PrismaService],
	controllers: [UsersController],
	exports: [UsersService],
	imports: [forwardRef(() => AuthModule), PrismaModule],
})
export class UsersModule {}
