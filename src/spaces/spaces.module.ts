import { Module } from '@nestjs/common';
import { DoSpacesServiceProvider } from '.';
import { SpacesService } from './spaces.service';

@Module({
	providers: [SpacesService, DoSpacesServiceProvider],
	exports: [SpacesService, DoSpacesServiceProvider],
})
export class SpacesModule {}
