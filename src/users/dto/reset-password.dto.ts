import { IsNotEmpty } from 'class-validator';

export class ResetPasswordDto {
	@IsNotEmpty()
	code: string;

	@IsNotEmpty()
	password: string;

	@IsNotEmpty()
	confirmPassword: string;
}
