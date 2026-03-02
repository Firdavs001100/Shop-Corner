import { registerEnumType } from '@nestjs/graphql';

export enum OrderStatus {
	PENDING = 'PENDING',
	PAID = 'PAID',
	SHIPPED = 'SHIPPED',
	DELIVERED = 'DELIVERED',
	CANCELLED = 'CANCELLED',
	DELETE = 'DELETE',
}
registerEnumType(OrderStatus, {
	name: 'OrderStatus',
});

export enum OrderPaymentStatus {
	UNPAID = 'UNPAID',
	PAID = 'PAID',
	REFUNDED = 'REFUNDED',
}
registerEnumType(OrderPaymentStatus, {
	name: 'OrderPaymentStatus',
});
