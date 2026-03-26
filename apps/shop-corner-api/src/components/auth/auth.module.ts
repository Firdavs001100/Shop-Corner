import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { AuthResolver } from './auth.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { MemberSchema } from '../../schemas/Member.model';

@Module({
	imports: [HttpModule, JwtModule.register({}), MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }])],
	providers: [AuthService, AuthResolver],
	exports: [AuthService],
})
export class AuthModule {}
