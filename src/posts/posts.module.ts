import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SpacesModule } from 'src/spaces/spaces.module';
import { SpacesService } from 'src/spaces/spaces.service';

@Module({
    providers: [SpacesService],
    imports: [PrismaModule, SpacesModule],
})
export class PostsModule {}
