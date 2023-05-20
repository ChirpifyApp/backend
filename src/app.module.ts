import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersController } from './users/users.controller';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsController } from './posts/posts.controller';
import { PostsService } from './posts/posts.service';
import { PostsModule } from './posts/posts.module';
import { SpacesService } from './spaces/spaces.service';
import { SpacesModule } from './spaces/spaces.module';
import { UsersService } from './users/users.service';
import { MailService } from './mail/mail.service';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, PostsModule, SpacesModule, MailModule],
  controllers: [AppController, UsersController, PostsController],
  providers: [AppService, PrismaService, PostsService, SpacesService, MailService],
})
export class AppModule {}
