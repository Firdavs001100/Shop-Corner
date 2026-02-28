import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { NotificationInput, NotificationInquiry } from '../../libs/dto/notification/notification.input';
import { Notifications, Notification } from '../../libs/dto/notification/notification';
import { T } from '../../libs/types/common';
import { Direction } from '../../libs/enums/common.enum';
import { Message } from '../../libs/Errors';
import { NotificationUpdate } from '../../libs/dto/notification/notification.update';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../libs/enums/notification.enum';

@Injectable()
export class NotificationService {
	constructor(@InjectModel('Notification') private readonly notificationModel: Model<Notification>) {}

	// SYSTEM
	public async createNotification(input: NotificationInput): Promise<Notification> {
		try {
			const result = await this.notificationModel.create(input);

			return result;
		} catch (err) {
			console.log('Error, notification.service.ts--createNotification:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async deleteLikeNotification(
		authorId: ObjectId,
		receiverId: ObjectId,
		group: NotificationGroup,
	): Promise<void> {
		await this.notificationModel
			.deleteOne({
				authorId,
				receiverId,
				notificationType: NotificationType.LIKE,
				notificationGroup: group,
			})
			.exec();
	}

	// USER
	public async getNotifications(receiverId: ObjectId, input: NotificationInquiry): Promise<Notifications> {
		const { notificationStatus, notificationGroup, notificationType } = input.search,
			match: T = { receiverId },
			sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (notificationStatus) match.notificationStatus = notificationStatus;
		if (notificationGroup) match.notificationGroup = notificationGroup;
		if (notificationType) match.notificationType = notificationType;

		const result = await this.notificationModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async markNotificationAsRead(input: NotificationUpdate): Promise<Notification> {
		const { _id } = input;

		const result = await this.notificationModel.findOneAndUpdate({ _id }, input, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	public async markAllNotificationsAsRead(receiverId: ObjectId, input: NotificationInquiry): Promise<Notifications> {
		const { notificationGroup, notificationType, notificationStatus } = input.search;

		const updateResult = await this.notificationModel.updateMany(
			{
				receiverId,
				notificationStatus: NotificationStatus.UNREAD,
			},
			{ $set: { notificationStatus: NotificationStatus.READ } },
		);

		if (!updateResult.acknowledged) {
			throw new InternalServerErrorException(Message.UPDATE_FAILED);
		}

		const match: T = { receiverId };
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (notificationStatus) match.notificationStatus = notificationStatus;
		if (notificationGroup) match.notificationGroup = notificationGroup;
		if (notificationType) match.notificationType = notificationType;

		const result = await this.notificationModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	// ADMIN
	public async getAllNotificationsByAdmin(input: NotificationInquiry): Promise<Notifications> {
		const { notificationStatus, notificationGroup, notificationType } = input.search,
			match: T = {},
			sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (notificationStatus) match.notificationStatus = notificationStatus;
		if (notificationGroup) match.notificationGroup = notificationGroup;
		if (notificationType) match.notificationType = notificationType;

		const result = await this.notificationModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async createNotificationByAdmin(input: NotificationInput): Promise<Notification> {
		try {
			const result = await this.notificationModel.create(input);

			return result;
		} catch (err) {
			console.log('Error, notification.service.ts--createNotificationByAdmin:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async updateNotificationByAdmin(input: NotificationUpdate): Promise<Notification> {
		const { _id } = input;

		const result = await this.notificationModel.findOneAndUpdate({ _id }, input, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}
}
