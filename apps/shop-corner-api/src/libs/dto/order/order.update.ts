import { Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { OrderPaymentStatus, OrderStatus } from '../../enums/order.enum';

@InputType()
export class OrderUpdate {
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => OrderStatus, { nullable: true })
	orderStatus?: OrderStatus;

	@IsOptional()
	@Field(() => OrderPaymentStatus, { nullable: true })
	orderPaymentStatus?: OrderPaymentStatus;
}
