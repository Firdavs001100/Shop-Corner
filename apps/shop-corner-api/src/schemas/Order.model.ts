import mongoose, { Schema } from 'mongoose';
import { OrderPaymentStatus, OrderStatus } from '../libs/enums/order.enum';

const OrderSchema = new Schema(
	{
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		orderStatus: {
			type: String,
			enum: OrderStatus,
			default: OrderStatus.PENDING,
		},

		orderPaymentStatus: {
			type: String,
			enum: OrderPaymentStatus,
			default: OrderPaymentStatus.UNPAID,
		},

		orderShippingAddress: {
			type: Object,
			required: true,
		},

		orderTotal: {
			type: Number,
			required: true,
		},

		orderDelivery: {
			type: Number,
			required: true,
		},

		isDeleted: {
			type: Boolean,
			default: false,
			index: true,
		},

		deletedAt: {
			type: Date,
			default: null,
		},
	},
	{ timestamps: true },
);

export default OrderSchema;
