import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';
import { orderSortOptions } from '../../config';
import { OrderPaymentStatus, OrderStatus } from '../../enums/order.enum';

@InputType()
export class OrderItemInput {
	@IsNotEmpty()
	@Field(() => Number)
	itemQuantity: number;

	@IsNotEmpty()
	@Field(() => String)
	productId: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	orderId?: ObjectId;
}

@InputType()
export class OISearch {
	@IsOptional()
	@Field(() => [OrderStatus], { nullable: true })
	orderStatus?: OrderStatus[];

	@IsOptional()
	@Field(() => [OrderPaymentStatus], { nullable: true })
	orderPaymentStatus?: OrderPaymentStatus[];
}

@InputType()
export class OrdersInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(orderSortOptions)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => OISearch)
	search: OISearch;
}
