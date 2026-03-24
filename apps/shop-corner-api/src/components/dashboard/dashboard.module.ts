import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardResolver } from './dashboard.resolver';
import { AuthModule } from '../auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import OrderSchema from '../../schemas/Order.model';
import { MemberSchema } from '../../schemas/Member.model';
import ProductSchema from '../../schemas/Product.model';
import BoardArticleSchema from '../../schemas/BoardArticle.model';

@Module({
	imports: [
		AuthModule,
		MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),
		MongooseModule.forFeature([{ name: 'Product', schema: ProductSchema }]),
		MongooseModule.forFeature([{ name: 'BoardArticle', schema: BoardArticleSchema }]),
		MongooseModule.forFeature([{ name: 'Order', schema: OrderSchema }]),
	],
	providers: [DashboardResolver, DashboardService],
	exports: [DashboardService],
})
export class DashboardModule {}
