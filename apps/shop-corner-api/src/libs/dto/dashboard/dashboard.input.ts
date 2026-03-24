import { Field, InputType, Int } from '@nestjs/graphql';

/* -------- PERIOD  -------- */
@InputType()
export class DashboardPeriodFilterInput {
	@Field(() => String) // '7d' | '30d' | '12m'
	period: string;
}

/* -------- ACTIVITY -------- */
@InputType()
export class DashboardActivityInput {
	@Field(() => Int)
	limit: number;
}

/* -------- DATE RANGE -------- */
@InputType()
export class DashboardDateRangeInput {
	@Field()
	startDate: string;

	@Field()
	endDate: string;
}
