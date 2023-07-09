import { Body, Controller, Get, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { AuthService } from 'src/auth/auth.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt.auth.guard';
import { UserDecorator } from 'src/decorators/user.decorator';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UsersService } from './users.service';
import { Response } from 'express';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';

@Controller('users')
export class UsersController {
	constructor(private usersService: UsersService, private authService: AuthService) {}

	@Post('register')
	async register(@Body() registerUserDto: RegisterUserDto) {
		return this.authService.register(registerUserDto);
	}

	@Post('login')
	async login(@Body() loginUserDto: LoginUserDto, @Res({ passthrough: true }) response: Response) {
		const json = await this.authService.signIn(loginUserDto);
		response.cookie('session', json.jwt, { expires: new Date(Date.now() + 86400000) });
		return json;
	}

	@UseGuards(JwtAuthGuard)
	@Get('me')
	async me(@Req() request: any) {
		const { password, registerCodeId, ...rest } = request.user;
		return rest;
	}

	@UseGuards(JwtAuthGuard)
	@Put()
	async updateUser(@Body() updateUserDto: UpdateUserDto, @UserDecorator() user: User) {
		const update = await this.usersService.updateUser(user, updateUserDto);
		const { password, registerCodeId, ...rest } = update;
		return rest;
	}

	@Get('verify/:id')
	async verify(@Param('id') id: string, @Query('code') code: string, @Res() response: Response) {
		const user = await this.usersService.verifyUser(id, code);
		const json = await this.authService.createJwtToken(user.email, user.id);
		response.cookie('session', json.jwt, { expires: new Date(Date.now() + 86400000) });
		return response.send(json);
	}

	// For sending a request
	@Get('resetpassword')
	async resetPasswordRequest(@Body() requestResetPasswordDto: RequestResetPasswordDto) {
		console.log(requestResetPasswordDto);
		return await this.authService.sendResetPasswordEmail(requestResetPasswordDto);
	}

	// For handling the password change request
	@Post('resetpassword')
	async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
		return await this.authService.resetPassword(resetPasswordDto);
	}
}
