import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { ProductModule } from './product/product.module';
import { AuthModule } from './auth/auth.module';
import { ViewModule } from './view/view.module';
import { BoardArticleModule } from './board-article/board-article.module';
import { LikeModule } from './like/like.module';
import { CommentModule } from './comment/comment.module';
import { FollowModule } from './follow/follow.module';
import { NoticeModule } from './notice/notice.module';
import { NotificationModule } from './notification/notification.module';
import { OrderModule } from './order/order.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
	imports: [
		MemberModule,
		ProductModule,
		AuthModule,
		ViewModule,
		BoardArticleModule,
		CommentModule,
		LikeModule,
		FollowModule,
		NoticeModule,
		NotificationModule,
		OrderModule,
		DashboardModule,
	],
})
export class ComponentsModule {}
