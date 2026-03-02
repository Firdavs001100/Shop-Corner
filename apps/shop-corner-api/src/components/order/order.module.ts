import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderResolver } from './order.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import OrderSchema from '../../schemas/Order.model';
import OrderItemSchema from '../../schemas/OrderItem.model';
import { MemberModule } from '../member/member.module';
import { ProductModule } from '../product/product.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Order', schema: OrderSchema }]),
		MongooseModule.forFeature([{ name: 'OrderItem', schema: OrderItemSchema }]),
		AuthModule,
		ProductModule,
		MemberModule,
	],
	providers: [OrderResolver, OrderService],
	exports: [OrderService],
})
export class OrderModule {}
