import { Field, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { TotalCounter } from '../member/member';
import { OrderPaymentStatus, OrderStatus } from '../../enums/order.enum';
import { Product } from '../product/product';

@ObjectType()
export class ShippingAddress {
	@Field(() => String)
	fullAddress: string;
}

@ObjectType()
export class OrderItem {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	orderId: ObjectId;

	@Field(() => String)
	productId: ObjectId;

	@Field(() => Number)
	itemQuantity: number;

	@Field(() => Number)
	itemPrice: number;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class Order {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => OrderStatus)
	orderStatus: OrderStatus;

	@Field(() => OrderPaymentStatus)
	orderPaymentStatus: OrderPaymentStatus;

	@Field(() => ShippingAddress)
	orderShippingAddress: ShippingAddress;

	@Field(() => Number)
	orderTotal: number;

	@Field(() => Number)
	orderDelivery: number;

	@Field(() => Boolean)
	isDeleted: boolean;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date | null;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation **/

	@Field(() => [OrderItem], { nullable: true })
	orderItems?: OrderItem[];

	@Field(() => [Product], { nullable: true })
	productData?: Product[];
}

@ObjectType()
export class Orders {
	@Field(() => [Order])
	list: Order[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}
