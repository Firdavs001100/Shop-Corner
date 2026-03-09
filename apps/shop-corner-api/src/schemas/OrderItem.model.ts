import mongoose, { Schema } from 'mongoose';

const OrderItemSchema = new Schema(
	{
		orderId: {
			type: Schema.Types.ObjectId,
			ref: 'Order',
		},

		productId: {
			type: Schema.Types.ObjectId,
			ref: 'Product',
		},

		itemQuantity: {
			type: Number,
			required: true,
		},

		itemPrice: {
			type: Number,
			required: true,
		},

		itemSize: {
			type: String,
			required: true,
		},

		itemColor: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true, collection: 'orderItems' },
);

export default OrderItemSchema;
