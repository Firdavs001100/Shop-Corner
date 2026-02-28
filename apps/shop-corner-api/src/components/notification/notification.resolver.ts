import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { NotificationService } from './notification.service';
import { UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { ObjectId } from 'mongoose';
import { shapeIntoMongooseObjectId } from '../../libs/config';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Notifications, Notification } from '../../libs/dto/notification/notification';
import { NotificationInput, NotificationInquiry } from '../../libs/dto/notification/notification.input';
import { NotificationUpdate } from '../../libs/dto/notification/notification.update';

@Resolver()
export class NotificationResolver {
	constructor(private readonly notificationService: NotificationService) {}

	/** USER **/
	@UseGuards(AuthGuard)
	@Query(() => Notifications)
	public async getNotifications(
		@Args('input') input: NotificationInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Notifications> {
		console.log('Query: getNotifications');

		return await this.notificationService.getNotifications(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Notification)
	public async markNotificationAsRead(@Args('input') input: NotificationUpdate): Promise<Notification> {
		console.log('Query: markNotificationAsRead');

		return await this.notificationService.markNotificationAsRead(input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Notifications)
	public async markAllNotificationsAsRead(
		@Args('input') input: NotificationInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Notifications> {
		console.log('Mutation: markAllNotificationsAsRead');

		return await this.notificationService.markAllNotificationsAsRead(memberId, input);
	}

	/** ADMIN **/
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Notifications)
	public async getAllNotificationsByAdmin(@Args('input') input: NotificationInquiry): Promise<Notifications> {
		console.log('Query: getAllNotificationsByAdmin');

		return await this.notificationService.getAllNotificationsByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Notification)
	public async createNotificationByAdmin(
		@Args('input') input: NotificationInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Notification> {
		console.log('Mutation: createNotificationByAdmin');
		input.authorId = memberId;

		return await this.notificationService.createNotificationByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Notification)
	public async updateNotificationByAdmin(@Args('input') input: NotificationUpdate): Promise<Notification> {
		console.log('Mutation: updateNotificationByAdmin');
		input._id = shapeIntoMongooseObjectId(input._id);

		return await this.notificationService.updateNotificationByAdmin(input);
	}
}
