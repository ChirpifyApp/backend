import { Body, Controller, Get, Param, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { AuthService } from 'src/auth/auth.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt.auth.guard';
import { UserDecorator } from 'src/decorators/user.decorator';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UsersService } from './users.service';
import { Response } from 'express';

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService, private authService: AuthService) { }

    @Post('register')
    async register(@Body() registerUserDto: RegisterUserDto) {
        return this.authService.register(registerUserDto);
    }

    @Post('login')
    async login(@Body() loginUserDto: LoginUserDto, @Res({ passthrough: true }) response: Response) {
        let json = await this.authService.signIn(loginUserDto);
        response.cookie('session', json.jwt, { expires: new Date(Date.now() + 86400000)});
        return json;
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async me(@Req() request: any) {
        let { password, registerCodeId, ...rest } = request.user;
        return rest;
    }

    @UseGuards(JwtAuthGuard)
    @Put()
    async updateUser(@Body() updateUserDto: UpdateUserDto, @UserDecorator() user: User) {
        let update = await this.usersService.updateUser(user, updateUserDto);
        let { password, registerCodeId, ...rest } = update;
        return rest;
    }

    @Get('verify/:code')
    async verify(@Param('code') code: string) {
        return this.usersService.verifyUser(code);
    }
}
