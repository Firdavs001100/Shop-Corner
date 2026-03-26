import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Member } from '../../libs/dto/member/member';
import { JwtService } from '@nestjs/jwt';
import { T } from '../../libs/types/common';
import { shapeIntoMongooseObjectId } from '../../libs/config';

@Injectable()
export class AuthService {
	constructor(private jwtService: JwtService) {}
	public async hashPassword(memberPassword: string): Promise<string> {
		const salt = await bcrypt.genSalt();
		return await bcrypt.hash(memberPassword, salt);
	}
	public async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
		return await bcrypt.compare(password, hashedPassword);
	}

	public async createAccessToken(member: Member): Promise<string> {
		const payload: T = { ...(member['_doc'] || member) };
		delete payload.memberPassword;

		return this.jwtService.sign(payload, {
			secret: process.env.ACCESS_TOKEN_SECRET,
			expiresIn: '15m',
		});
	}

	public async createRefreshToken(member: Member): Promise<string> {
		return this.jwtService.sign(
			{ _id: member._id },
			{
				secret: process.env.REFRESH_TOKEN_SECRET,
				expiresIn: '7d',
			},
		);
	}

	public async verifyToken(token: string): Promise<Member> {
		const member = await this.jwtService.verifyAsync(token, {
			secret: process.env.ACCESS_TOKEN_SECRET,
		});

		member._id = shapeIntoMongooseObjectId(member._id);
		return member;
	}
}
