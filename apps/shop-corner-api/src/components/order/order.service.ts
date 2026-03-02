import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, ObjectId } from 'mongoose';
import { Order, OrderItem, Orders } from '../../libs/dto/order/order';
import { ProductService } from '../product/product.service';
import { MemberService } from '../member/member.service';
import { OrderItemInput, OrdersInquiry } from '../../libs/dto/order/order.input';
import { Message } from '../../libs/Errors';
import { lookupOrderItems, lookupProductData, shapeIntoMongooseObjectId } from '../../libs/config';
import { OrderPaymentStatus, OrderStatus } from '../../libs/enums/order.enum';
import { T } from '../../libs/types/common';
import { Direction } from '../../libs/enums/common.enum';
import { OrderUpdate } from '../../libs/dto/order/order.update';

@Injectable()
export class OrderService {
	constructor(
		@InjectModel('Order') private readonly orderModel: Model<Order>,
		@InjectModel('OrderItem') private readonly orderItemModel: Model<OrderItem>,
		private readonly productService: ProductService,
		private readonly memberService: MemberService,
	) {}

	// USER
	public async createOrder(memberId: ObjectId, input: OrderItemInput[]): Promise<Order> {
		const memberData = await this.memberService.getMember(null, memberId);
		console.log('member.memberAddress:', memberData.memberAddress);

		if (!memberData.memberAddress) {
			throw new BadRequestException(Message.NO_SHIPPING_ADDRESS);
		}
		const shippingAddress = { fullAddress: memberData.memberAddress };

		const session: ClientSession = await this.orderModel.startSession();
		session.startTransaction();

		try {
			let amount = 0;

			const preparedItems = [];

			for (const item of input) {
				const product = await this.productService.getProduct(null, item.productId);

				if (!product) {
					throw new InternalServerErrorException(Message.NO_DATA_FOUND);
				}

				if (product.productStockCount < item.itemQuantity) {
					throw new BadRequestException(`Not enough stock for ${product.productName}`);
				}

				const finalPrice =
					product.isDiscounted && product.productSalePrice > 0 ? product.productSalePrice : product.productPrice;
				amount += finalPrice * item.itemQuantity;

				preparedItems.push({
					itemQuantity: item.itemQuantity,
					itemPrice: finalPrice,
					productId: shapeIntoMongooseObjectId(item.productId),
				});
			}

			const delivery = amount < 150000 ? 10000 : 0;

			const [newOrder] = await this.orderModel.create(
				[
					{
						memberId,
						orderStatus: OrderStatus.PENDING,
						orderPaymentStatus: OrderPaymentStatus.UNPAID,
						orderShippingAddress: shippingAddress,
						orderTotal: amount + delivery,
						orderDelivery: delivery,
					},
				],
				{ session },
			);

			await this.recordOrderItem(newOrder._id, preparedItems, session);

			await session.commitTransaction();

			return newOrder;
		} catch (err) {
			await session.abortTransaction();
			console.log('Error, order.service.ts--createProduct:', err);

			throw new BadRequestException(Message.CREATE_FAILED);
		} finally {
			session.endSession();
		}
	}

	private async recordOrderItem(
		orderId: ObjectId,
		items: Omit<OrderItemInput, 'orderId'>[],
		session: ClientSession,
	): Promise<void> {
		await this.orderItemModel.insertMany(
			items.map((item) => ({
				...item,
				orderId,
			})),
			{ session },
		);
	}

	public async getOrders(memberId: ObjectId, input: OrdersInquiry): Promise<Orders> {
		const { orderStatus, orderPaymentStatus } = input.search,
			match: T = { memberId },
			sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (orderStatus) match.orderStatus = orderStatus;
		if (orderPaymentStatus) match.orderPaymentStatus = orderPaymentStatus;

		const result = await this.orderModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupOrderItems,
							lookupProductData,
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async updateOrder(memberId: ObjectId, input: OrderUpdate): Promise<Order> {
		const orderId = shapeIntoMongooseObjectId(input._id);

		const order = await this.orderModel.findOne({
			_id: orderId,
			memberId,
			isDeleted: false,
		});

		if (!order) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (order.orderStatus === OrderStatus.CANCELLED) {
			throw new BadRequestException(Message.INVALID_STATUS_CHANGE);
		}

		const prevStatus = order.orderStatus;

		// User can cancel (before shipping)
		if (input.orderStatus === OrderStatus.CANCELLED) {
			if ([OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(order.orderStatus)) {
				throw new BadRequestException(Message.INVALID_STATUS_CHANGE);
			}
			order.orderStatus = OrderStatus.CANCELLED;
		}

		// Payment success TODO:(payment system later should be developed)
		if (input.orderPaymentStatus === OrderPaymentStatus.PAID) {
			if (order.orderPaymentStatus === OrderPaymentStatus.PAID) {
				throw new BadRequestException(Message.INVALID_STATUS_CHANGE);
			}

			order.orderPaymentStatus = OrderPaymentStatus.PAID;

			if (order.orderStatus === OrderStatus.PENDING) {
				order.orderStatus = OrderStatus.PAID;
			}
		}

		await order.save();

		/* Points added only once */
		/* Registering the sales for that product */
		if (prevStatus !== OrderStatus.DELIVERED && order.orderStatus === OrderStatus.DELIVERED) {
			await this.memberService.memberStatsEditor({
				_id: memberId,
				targetKey: 'memberPoints',
				modifier: 1,
			});

			const orderItems = await this.orderItemModel.find({ orderId: order._id }).exec();
			await this.productService.updateProductOrderStats(orderItems);
		}

		return order;
	}

	// ADMIN
	public async getAllOrdersByAdmin(input: OrdersInquiry): Promise<Orders> {
		const { orderStatus, orderPaymentStatus } = input.search,
			match: T = {},
			sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (orderStatus) match.orderStatus = orderStatus;
		if (orderPaymentStatus) match.orderPaymentStatus = orderPaymentStatus;

		const result = await this.orderModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupOrderItems,
							lookupProductData,
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async updateOrderByAdmin(input: OrderUpdate): Promise<Order> {
		const orderId = shapeIntoMongooseObjectId(input._id);

		const order = await this.orderModel.findOne({
			_id: orderId,
			isDeleted: false,
		});

		if (!order) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (order.orderStatus === OrderStatus.CANCELLED) {
			throw new BadRequestException(Message.INVALID_STATUS_CHANGE);
		}

		if (input.orderStatus === OrderStatus.SHIPPED && order.orderPaymentStatus !== OrderPaymentStatus.PAID) {
			throw new BadRequestException(Message.PAYMENT_REQUIRED);
		}

		const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
			PENDING: [OrderStatus.PAID, OrderStatus.CANCELLED],
			PAID: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
			SHIPPED: [OrderStatus.DELIVERED],
			DELIVERED: [],
			CANCELLED: [],
			DELETE: [],
		};

		if (input.orderStatus) {
			const allowed = allowedTransitions[order.orderStatus] || [];
			if (!allowed.includes(input.orderStatus)) {
				throw new BadRequestException(Message.INVALID_STATUS_CHANGE);
			}
			order.orderStatus = input.orderStatus;
		}

		if (input.orderPaymentStatus) {
			order.orderPaymentStatus = input.orderPaymentStatus;
		}

		const prevStatus = order.orderStatus;
		await order.save();

		if (prevStatus !== OrderStatus.DELIVERED && order.orderStatus === OrderStatus.DELIVERED) {
			await this.memberService.memberStatsEditor({
				_id: order.memberId,
				targetKey: 'memberPoints',
				modifier: 1,
			});

			const orderItems = await this.orderItemModel.find({ orderId: order._id }).exec();
			await this.productService.updateProductOrderStats(orderItems);
		}

		return this.orderModel.findById(order._id);
	}
}
