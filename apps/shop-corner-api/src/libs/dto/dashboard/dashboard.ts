import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Member } from '../member/member';
import { Order } from '../order/order';
import { BoardArticle } from '../board-article/board-article';

/* ----------- OVERVIEW ----------- */

@ObjectType()
export class DashboardOverview {
	@Field(() => Int)
	totalMembers: number;

	@Field(() => Int)
	totalProducts: number;

	@Field(() => Int)
	totalOrders: number;

	@Field(() => Int)
	totalArticles: number;

	@Field(() => Float)
	totalRevenue: number;

	@Field(() => Float)
	todayRevenue: number;

	@Field(() => Int)
	todayOrders: number;
}

/* ----------- SALES ANALYTICS ----------- */

@ObjectType()
export class SalesAnalyticsItem {
	@Field(() => String)
	date: string;

	@Field(() => Float)
	revenue: number;

	@Field(() => Int)
	orders: number;
}

@ObjectType()
export class SalesAnalytics {
	@Field(() => [SalesAnalyticsItem])
	list: SalesAnalyticsItem[];
}

/* ----------- ACTIVITY ----------- */

@ObjectType()
export class DashboardActivity {
	@Field(() => [Order])
	recentOrders: Order[];

	@Field(() => [Member])
	recentMembers: Member[];

	@Field(() => [BoardArticle])
	recentArticles: BoardArticle[];
}

@ObjectType()
export class DashboardAlerts {
	@Field(() => Int)
	lowStockProducts: number;

	@Field(() => Int)
	pendingOrders: number;

	@Field(() => Int)
	deletedArticles: number;
}

/* ----------- INSIGHTS ----------- */

@ObjectType()
export class TopSellingProduct {
	@Field()
	_id: string;

	@Field()
	productName: string;

	@Field(() => Int)
	soldCount: number;
}

@ObjectType()
export class TopCustomer {
	@Field()
	_id: string;

	@Field()
	memberNick: string;

	@Field(() => Int)
	totalSpent: number;
}

@ObjectType()
export class OrderStatusStat {
	@Field()
	status: string;

	@Field(() => Int)
	count: number;
}

@ObjectType()
export class DashboardInsights {
	@Field(() => [TopSellingProduct])
	topSellingProducts: TopSellingProduct[];

	@Field(() => [TopCustomer])
	topCustomers: TopCustomer[];

	@Field(() => [OrderStatusStat])
	orderStatusStats: OrderStatusStat[];
}

/* ----------- INVENTORY ----------- */

@ObjectType()
export class InventoryStatus {
	@Field(() => Int)
	inStock: number;

	@Field(() => Int)
	lowStock: number;

	@Field(() => Int)
	outOfStock: number;
}

/* ----------- REVENUE ----------- */

@ObjectType()
export class RevenueBreakdown {
	@Field()
	date: string;

	@Field(() => Int)
	amount: number;
}

@ObjectType()
export class RevenueResponse {
	@Field(() => Int)
	total: number;

	@Field(() => [RevenueBreakdown])
	breakdown: RevenueBreakdown[];
}
