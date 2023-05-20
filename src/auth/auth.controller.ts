import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { DiscordAuthGuard } from './guard/discord.auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @UseGuards(DiscordAuthGuard)
    @Get('discord/login')
    async login() {
        return;
    }

    @UseGuards(DiscordAuthGuard)
    @Get('discord/callback')
    async discordAuthRedirect(@Req() req: any, @Res({ passthrough: true }) res: Response): Promise<Response> {
        const { user }: { user: any } = req;

        const jwt = await this.authService.discordSignIn(user);
        // Expire after 1 day
        res.cookie('session', jwt, { httpOnly: true, expires: new Date(Date.now() + 86400000) });

        return res.status(201).json({ jwt });
    }
}
