import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DashboardService } from './dashboard.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
	DashboardActivity,
	DashboardAlerts,
	DashboardInsights,
	DashboardOverview,
	InventoryStatus,
	RevenueResponse,
	SalesAnalytics,
} from '../../libs/dto/dashboard/dashboard';
import {
	DashboardActivityInput,
	DashboardPeriodFilterInput,
	DashboardDateRangeInput,
} from '../../libs/dto/dashboard/dashboard.input';

@Resolver()
export class DashboardResolver {
	constructor(private readonly dashboardService: DashboardService) {}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => DashboardOverview)
	public async getDashboardOverview() {
		console.log('Query: getDashboardOverview');

		return await this.dashboardService.getDashboardOverview();
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => SalesAnalytics)
	public async getSalesAnalytics(@Args('input') input: DashboardPeriodFilterInput) {
		console.log('Query: getSalesAnalytics');

		return await this.dashboardService.getSalesAnalytics(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => DashboardActivity)
	public async getRecentActivity(@Args('input') input: DashboardActivityInput) {
		console.log('Query: getRecentActivity');

		return await this.dashboardService.getRecentActivity(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => DashboardAlerts)
	public async getAdminAlerts() {
		console.log('Query: getAdminAlerts');

		return await this.dashboardService.getAdminAlerts();
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => DashboardInsights)
	public async getDashboardInsights(): Promise<DashboardInsights> {
		console.log('Query: getDashboardInsights');

		return await this.dashboardService.getDashboardInsights();
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => InventoryStatus)
	public async getInventoryStatus(): Promise<InventoryStatus> {
		console.log('Query: getInventoryStatus');

		return await this.dashboardService.getInventoryStatus();
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => RevenueResponse)
	public async getRevenueByPeriod(@Args('input') input: DashboardDateRangeInput): Promise<RevenueResponse> {
		console.log('Query: getRevenueByPeriod');

		return await this.dashboardService.getRevenueByPeriod(input);
	}
}
