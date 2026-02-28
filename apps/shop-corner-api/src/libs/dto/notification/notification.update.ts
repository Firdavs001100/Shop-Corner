import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../enums/notification.enum';

@InputType()
export class NotificationUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => NotificationStatus, { nullable: true })
	notificationStatus?: NotificationStatus;

	@IsOptional()
	@Field(() => NotificationType, { nullable: true })
	notificationType?: NotificationType;

	@IsOptional()
	@Field(() => NotificationGroup, { nullable: true })
	notificationGroup?: NotificationGroup;

	@IsOptional()
	@Length(3, 150)
	@Field(() => String, { nullable: true })
	notificationTitle?: string;

	@IsOptional()
	@Length(3, 300)
	@Field(() => String, { nullable: true })
	notificationDesc?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	productId?: ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	articleId?: ObjectId;
}
