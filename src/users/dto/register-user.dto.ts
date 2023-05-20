import { IsNotEmpty, IsOptional } from "class-validator";

export class RegisterUserDto {
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    name: string;

    @IsOptional()
    password?: string;

    @IsOptional()
    discordUid?: string;
}