import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { OrderService } from './order.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { ObjectId } from 'mongoose';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OrderItemInput, OrdersInquiry } from '../../libs/dto/order/order.input';
import { Order, Orders } from '../../libs/dto/order/order';
import { OrderUpdate } from '../../libs/dto/order/order.update';

@Resolver()
export class OrderResolver {
	constructor(private readonly orderService: OrderService) {}

	/** USER **/
	@UseGuards(AuthGuard)
	@Mutation(() => Order)
	public async createOrder(
		@Args('input', { type: () => [OrderItemInput] }) input: OrderItemInput[],
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Order> {
		console.log('Mutation: createOrder');

		return await this.orderService.createOrder(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Orders)
	public async getOrders(@Args('input') input: OrdersInquiry, @AuthMember('_id') memberId: ObjectId): Promise<Orders> {
		console.log('Query: getOrders');

		return await this.orderService.getOrders(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Order)
	public async updateOrder(@Args('input') input: OrderUpdate, @AuthMember('_id') memberId: ObjectId): Promise<Order> {
		console.log('Query: updateOrder');

		return await this.orderService.updateOrder(memberId, input);
	}

	/** ADMIN **/
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Orders)
	public async getAllOrdersByAdmin(@Args('input') input: OrdersInquiry): Promise<Orders> {
		console.log('Query: getAllOrdersByAdmin');

		return await this.orderService.getAllOrdersByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Order)
	public async updateOrderByAdmin(
		@Args('input') input: OrderUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Order> {
		console.log('Mutation: updateOrderByAdmin');

		return await this.orderService.updateOrderByAdmin(memberId, input);
	}
}
