import { Module } from '@nestjs/common';
import { BoardArticleService } from './board-article.service';
import { BoardArticleResolver } from './board-article.resolver';
import { AuthModule } from '../auth/auth.module';
import { ViewModule } from '../view/view.module';
import { MemberModule } from '../member/member.module';
import { MongooseModule } from '@nestjs/mongoose';
import { LikeModule } from '../like/like.module';
import BoardArticleSchema from '../../schemas/BoardArticle.model';
import { NotificationModule } from '../notification/notification.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'BoardArticle', schema: BoardArticleSchema }]),
		AuthModule,
		ViewModule,
		MemberModule,
		LikeModule,
		NotificationModule,
	],
	providers: [BoardArticleResolver, BoardArticleService],
	exports: [BoardArticleService],
})
export class BoardArticleModule {}
