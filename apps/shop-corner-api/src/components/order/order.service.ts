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
import { NotificationService } from '../notification/notification.service';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';

@Injectable()
export class OrderService {
	constructor(
		@InjectModel('Order') private readonly orderModel: Model<Order>,
		@InjectModel('OrderItem') private readonly orderItemModel: Model<OrderItem>,
		private readonly productService: ProductService,
		private readonly memberService: MemberService,
		private readonly notificationService: NotificationService,
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

		const prevPaymentStatus = order.orderPaymentStatus;
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

		// Notify the user
		const adminId = await this.memberService.getAdminId();

		if (prevPaymentStatus !== OrderPaymentStatus.PAID && order.orderPaymentStatus === OrderPaymentStatus.PAID) {
			await this.notificationService.createNotification({
				notificationType: NotificationType.ORDER,
				notificationGroup: NotificationGroup.MEMBER,
				notificationTitle: 'Payment successful 💳',
				notificationDesc: `Your payment for order #${order._id.toString()} was successful.`,
				authorId: adminId,
				receiverId: memberId,
			});
		}

		if (prevStatus !== order.orderStatus && order.orderStatus === OrderStatus.CANCELLED) {
			await this.notificationService.createNotification({
				notificationType: NotificationType.ORDER,
				notificationGroup: NotificationGroup.MEMBER,
				notificationTitle: 'Order cancelled',
				notificationDesc: `Your order #${order._id.toString()} has been cancelled.`,
				authorId: adminId,
				receiverId: memberId,
			});
		}

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

	public async updateOrderByAdmin(memberId: ObjectId, input: OrderUpdate): Promise<Order> {
		const orderId = shapeIntoMongooseObjectId(input._id);

		const order = await this.orderModel.findOne({
			_id: orderId,
			isDeleted: false,
		});

		if (!order) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (order.orderStatus === OrderStatus.CANCELLED) {
			throw new BadRequestException(Message.INVALID_STATUS_CHANGE);
		}

		const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
			[OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
			[OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
			[OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
			[OrderStatus.DELIVERED]: [],
			[OrderStatus.CANCELLED]: [],
			[OrderStatus.DELETE]: [],
		};

		const prevStatus = order.orderStatus;

		// Status change
		if (input.orderStatus) {
			const allowed = allowedTransitions[order.orderStatus] || [];
			if (!allowed.includes(input.orderStatus)) {
				throw new BadRequestException(Message.INVALID_STATUS_CHANGE);
			}

			// Shipping only after payment
			if (input.orderStatus === OrderStatus.SHIPPED && order.orderPaymentStatus !== OrderPaymentStatus.PAID) {
				throw new BadRequestException(Message.PAYMENT_REQUIRED);
			}

			order.orderStatus = input.orderStatus;
		}

		// Payment change
		if (input.orderPaymentStatus) {
			if (
				order.orderPaymentStatus === OrderPaymentStatus.PAID &&
				input.orderPaymentStatus === OrderPaymentStatus.PAID
			) {
				throw new BadRequestException(Message.INVALID_STATUS_CHANGE);
			}

			order.orderPaymentStatus = input.orderPaymentStatus;

			// Sync orderStatus with payment
			if (input.orderPaymentStatus === OrderPaymentStatus.PAID && order.orderStatus === OrderStatus.PENDING) {
				order.orderStatus = OrderStatus.PAID;
			}
		}

		await order.save();

		// User notification (only when status changed)
		if (prevStatus !== order.orderStatus) {
			await this.notificationService.createNotification({
				notificationType: NotificationType.ORDER,
				notificationGroup: NotificationGroup.MEMBER,
				notificationTitle: `Order ${order.orderStatus}`,
				notificationDesc: this.buildOrderMessage(order.orderStatus, order._id),
				authorId: memberId,
				receiverId: order.memberId,
			});
		}

		// Points + product stats only once when delivered
		if (prevStatus !== OrderStatus.DELIVERED && order.orderStatus === OrderStatus.DELIVERED) {
			await this.memberService.memberStatsEditor({
				_id: order.memberId,
				targetKey: 'memberPoints',
				modifier: 1,
			});

			const orderItems = await this.orderItemModel.find({ orderId: order._id }).exec();
			await this.productService.updateProductOrderStats(orderItems);
		}

		return order;
	}

	private buildOrderMessage(status: OrderStatus, orderId: ObjectId): string {
		switch (status) {
			case OrderStatus.PAID:
				return `Your payment for order #${orderId} was confirmed.`;
			case OrderStatus.SHIPPED:
				return `Your order #${orderId} has been shipped.`;
			case OrderStatus.DELIVERED:
				return `Your order #${orderId} has been delivered.`;
			case OrderStatus.CANCELLED:
				return `Your order #${orderId} was cancelled by admin.`;
			default:
				return `Your order #${orderId} status changed to ${status}.`;
		}
	}
}
