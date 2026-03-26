import { Context, Mutation, Resolver } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from '../../libs/dto/member/member';

@Resolver()
export class AuthResolver {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		private readonly authService: AuthService,
		private jwtService: JwtService,
	) {}

	@Mutation(() => String)
	public async refreshToken(@Context() ctx): Promise<string> {
		const refreshToken = ctx.req.headers['x-refresh-token'];

		if (!refreshToken) throw new Error('No refresh token');

		const decoded = await this.jwtService.verifyAsync(refreshToken, {
			secret: process.env.REFRESH_TOKEN_SECRET,
		});

		const member = await this.memberModel.findById(decoded._id);

		return this.authService.createAccessToken(member);
	}
}
