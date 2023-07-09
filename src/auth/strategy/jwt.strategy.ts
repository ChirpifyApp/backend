import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { Request } from 'express';
import { User } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private authService: AuthService) {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				(request: Request) => {
					const data = request?.cookies['session'];
					return data ? data : undefined;
				},
			]),
			ignoreExpiration: false,
			secretOrKey: process.env.JWT_SECRET,
		});
	}

	async validate(payload: any, done): Promise<User> {
		if (!payload.uid || !payload.password) return done(null, false);
		return await this.authService.getValidation(payload.uid, payload.password);
	}
}
