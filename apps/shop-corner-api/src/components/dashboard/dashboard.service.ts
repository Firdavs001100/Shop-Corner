import { Injectable } from '@nestjs/common';
import {
	DashboardActivity,
	DashboardAlerts,
	DashboardOverview,
	SalesAnalytics,
} from '../../libs/dto/dashboard/dashboard';
import {
	DashboardActivityInput,
	DashboardPeriodFilterInput,
	DashboardDateRangeInput,
} from '../../libs/dto/dashboard/dashboard.input';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Member } from '../../libs/dto/member/member';
import { Product } from '../../libs/dto/product/product';
import { BoardArticle } from '../../libs/dto/board-article/board-article';
import { Order } from '../../libs/dto/order/order';

@Injectable()
export class DashboardService {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Product') private readonly productModel: Model<Product>,
		@InjectModel('BoardArticle') private readonly boardArticleModel: Model<BoardArticle>,
		@InjectModel('Order') private readonly orderModel: Model<Order>,
	) {}

	public async getDashboardOverview(): Promise<DashboardOverview> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const [members, products, articles, ordersData, todayOrdersData] = await Promise.all([
			this.memberModel.countDocuments(),
			this.productModel.countDocuments(),
			this.boardArticleModel.countDocuments(),
			this.orderModel.aggregate([
				{
					$group: {
						_id: null,
						totalRevenue: { $sum: '$orderTotal' },
						totalOrders: { $sum: 1 },
					},
				},
			]),
			this.orderModel.aggregate([
				{
					$match: { createdAt: { $gte: today } },
				},
				{
					$group: {
						_id: null,
						todayRevenue: { $sum: '$orderTotal' },
						todayOrders: { $sum: 1 },
					},
				},
			]),
		]);

		return {
			totalMembers: members,
			totalProducts: products,
			totalArticles: articles,
			totalOrders: ordersData[0]?.totalOrders ?? 0,
			totalRevenue: ordersData[0]?.totalRevenue ?? 0,
			todayRevenue: todayOrdersData[0]?.todayRevenue ?? 0,
			todayOrders: todayOrdersData[0]?.todayOrders ?? 0,
		};
	}

	public async getSalesAnalytics(input: DashboardPeriodFilterInput): Promise<SalesAnalytics> {
		const days = input.period === '30d' ? 30 : input.period === '12m' ? 365 : 7;

		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		const result = await this.orderModel.aggregate([
			{
				$match: { createdAt: { $gte: startDate } },
			},
			{
				$group: {
					_id: {
						$dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
					},
					revenue: { $sum: '$orderTotal' },
					orders: { $sum: 1 },
				},
			},
			{ $sort: { _id: 1 } },
		]);

		return {
			list: result.map((r) => ({
				date: r._id,
				revenue: r.revenue,
				orders: r.orders,
			})),
		};
	}

	public async getRecentActivity(input: DashboardActivityInput): Promise<DashboardActivity> {
		const limit = input.limit ?? 5;

		const [orders, members, articles] = await Promise.all([
			this.orderModel.find().sort({ createdAt: -1 }).limit(limit),
			this.memberModel.find().sort({ createdAt: -1 }).limit(limit),
			this.boardArticleModel.find().sort({ createdAt: -1 }).limit(limit),
		]);

		return {
			recentOrders: orders,
			recentMembers: members,
			recentArticles: articles,
		};
	}

	public async getAdminAlerts(): Promise<DashboardAlerts> {
		const [lowStock, pendingOrders, deletedArticles] = await Promise.all([
			this.productModel.countDocuments({ productStockCount: { $lt: 5 } }),
			this.orderModel.countDocuments({ orderStatus: 'PENDING' }),
			this.boardArticleModel.countDocuments({ articleStatus: 'DELETE' }),
		]);

		return {
			lowStockProducts: lowStock,
			pendingOrders,
			deletedArticles,
		};
	}

	public async getDashboardInsights() {
		const topSellingProducts = await this.orderModel.aggregate([
			{ $unwind: '$products' },
			{
				$group: {
					_id: '$products.productId',
					soldCount: { $sum: '$products.quantity' },
				},
			},
			{ $sort: { soldCount: -1 } },
			{ $limit: 5 },
			{
				$lookup: {
					from: 'products',
					localField: '_id',
					foreignField: '_id',
					as: 'product',
				},
			},
			{ $unwind: '$product' },
			{
				$project: {
					_id: 1,
					productName: '$product.productName',
					soldCount: 1,
				},
			},
		]);

		const topCustomers = await this.orderModel.aggregate([
			{
				$group: {
					_id: '$memberId',
					totalSpent: { $sum: '$totalPrice' },
				},
			},
			{ $sort: { totalSpent: -1 } },
			{ $limit: 5 },
			{
				$lookup: {
					from: 'members',
					localField: '_id',
					foreignField: '_id',
					as: 'member',
				},
			},
			{ $unwind: '$member' },
			{
				$project: {
					_id: 1,
					memberNick: '$member.memberNick',
					totalSpent: 1,
				},
			},
		]);

		const orderStatusStats = await this.orderModel.aggregate([
			{
				$group: {
					_id: '$orderStatus',
					count: { $sum: 1 },
				},
			},
			{
				$project: {
					status: '$_id',
					count: 1,
					_id: 0,
				},
			},
		]);

		return {
			topSellingProducts,
			topCustomers,
			orderStatusStats,
		};
	}

	public async getInventoryStatus() {
		const inStock = await this.productModel.countDocuments({ stock: { $gt: 10 } });
		const lowStock = await this.productModel.countDocuments({
			stock: { $gt: 0, $lte: 10 },
		});
		const outOfStock = await this.productModel.countDocuments({ stock: 0 });

		return { inStock, lowStock, outOfStock };
	}

	public async getRevenueByPeriod(input: DashboardDateRangeInput) {
		const { startDate, endDate } = input;

		const data = await this.orderModel.aggregate([
			{
				$match: {
					createdAt: {
						$gte: new Date(startDate),
						$lte: new Date(endDate),
					},
				},
			},
			{
				$group: {
					_id: {
						$dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
					},
					amount: { $sum: '$totalPrice' },
				},
			},
			{ $sort: { _id: 1 } },
		]);

		const total = data.reduce((sum, item) => sum + item.amount, 0);

		const breakdown = data.map((item) => ({
			date: item._id,
			amount: item.amount,
		}));

		return { total, breakdown };
	}
}
