import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { LoginInput, MemberInput, MembersInquiry } from '../../libs/dto/member/member.input';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Member, Members } from '../../libs/dto/member/member';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { Message } from '../../libs/Errors';
import { AuthService } from '../auth/auth.service';
import { MemberUpdate } from '../../libs/dto/member/member.update';
import { ViewService } from '../view/view.service';
import { ViewGroup } from '../../libs/enums/view.enum';
import { Direction } from '../../libs/enums/common.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { Follower, Following, MeFollowed } from '../../libs/dto/follow/follow';
import { NotificationService } from '../notification/notification.service';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';

@Injectable()
export class MemberService {
	constructor(
		@InjectModel('Member') private readonly memberModel: Model<Member>,
		@InjectModel('Follow') private readonly followModel: Model<Follower | Following>,
		private readonly authService: AuthService,
		private readonly viewService: ViewService,
		private readonly likeService: LikeService,
		private readonly notificationService: NotificationService,
	) {}

	public async signup(input: MemberInput): Promise<Member> {
		input.memberPassword = await this.authService.hashPassword(input.memberPassword);
		try {
			const result = await this.memberModel.create(input);

			result.accessToken = await this.authService.createToken(result);
			return result;
		} catch (err) {
			console.log('Error, member.model.ts:', err);
			throw new BadRequestException(err);
		}
	}

	public async login(loginInput: LoginInput): Promise<Member> {
		const { memberNick, memberPassword } = loginInput;

		const response = await this.memberModel.findOne({ memberNick }).select('+memberPassword').exec();

		if (!response || response.memberStatus === MemberStatus.DELETE) {
			throw new InternalServerErrorException(Message.NO_MEMBER_NICK);
		} else if (response.memberStatus === MemberStatus.BLOCK) {
			throw new InternalServerErrorException(Message.BLOCKED_USER);
		}

		const isMatch = await this.authService.comparePasswords(memberPassword, response.memberPassword);
		if (!isMatch) throw new InternalServerErrorException(Message.WRONG_PASSWORD);

		response.accessToken = await this.authService.createToken(response);
		return response;
	}

	public async getMember(memberId: ObjectId, targetId: ObjectId): Promise<Member> {
		const search: T = {
			_id: targetId,
			memberStatus: { $in: [MemberStatus.ACTIVE, MemberStatus.BLOCK] },
		};

		let targetMember = await this.memberModel.findOne(search).lean().exec();
		if (!targetMember) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const viewInput = { memberId: memberId, viewRefId: targetId, viewGroup: ViewGroup.MEMBER },
				newView = await this.viewService.viewRecord(viewInput);
			if (newView) {
				targetMember = await this.memberModel
					.findOneAndUpdate(search, { $inc: { memberViews: 1 } }, { new: true })
					.exec();
			}

			const input: LikeInput = {
				memberId,
				likeRefId: targetId,
				likeGroup: LikeGroup.MEMBER,
			};
			targetMember.meLiked = await this.likeService.checkLikeExistance(input);

			targetMember.meFollowed = await this.checkSubscription(memberId, targetId);
		}

		return targetMember;
	}

	private async checkSubscription(followerId: ObjectId, followingId: ObjectId): Promise<MeFollowed[]> {
		const result = await this.followModel.findOne({ followingId, followerId }).exec();

		return result ? [{ followerId, followingId, myFollowing: true }] : [];
	}

	public async updateMember(memberId: ObjectId, input: MemberUpdate): Promise<Member> {
		if (input.memberNewPassword) {
			const member = await this.memberModel.findById(memberId).select('+memberPassword').lean().exec();

			if (!member) throw new InternalServerErrorException(Message.NO_MEMBER_NICK);

			// compare CURRENT password
			const isMatch = await this.authService.comparePasswords(input.memberPassword, member.memberPassword);

			if (!isMatch) throw new InternalServerErrorException(Message.CURRENT_PASSWORD_MISMATCH);

			// hash NEW password
			input.memberPassword = await this.authService.hashPassword(input.memberNewPassword);
		}

		delete input.memberNewPassword;

		const result = await this.memberModel
			.findOneAndUpdate({ _id: memberId, memberStatus: MemberStatus.ACTIVE }, input, { new: true })
			.exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		result.accessToken = await this.authService.createToken(result);
		return result;
	}

	public async likeTargetMember(memberId: ObjectId, likeRefId: ObjectId): Promise<Member> {
		const target: Member = await this.memberModel.findOne({ _id: likeRefId, memberStatus: MemberStatus.ACTIVE }).exec();

		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = {
			memberId,
			likeRefId,
			likeGroup: LikeGroup.MEMBER,
		};

		// like toggle logic via like service model
		const { modifier, isLiked } = await this.likeService.toggleLike(input);

		const result = await this.memberStatsEditor({
			_id: likeRefId,
			targetKey: 'memberLikes',
			modifier,
		});

		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);

		// create notification via notification service model
		if (isLiked && memberId.toString() !== likeRefId.toString()) {
			const author = await this.memberModel.findById(memberId).exec();
			if (!author) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

			await this.notificationService.createNotification({
				notificationType: NotificationType.LIKE,
				notificationGroup: NotificationGroup.MEMBER,
				notificationTitle: 'Someone liked your profile',
				notificationDesc: `${author.memberNick} liked your profile.`,
				authorId: memberId,
				receiverId: likeRefId,
			});
		}

		if (!isLiked) {
			await this.notificationService.deleteLikeNotification(memberId, likeRefId, NotificationGroup.MEMBER);
		}

		return result;
	}

	// ADMIN

	public async getAllMembersByAdmin(input: MembersInquiry): Promise<Members> {
		const { text, memberStatus, memberType } = input.search,
			match: T = {},
			sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (text) match.memberNick = { $regex: new RegExp(text, 'i') };
		if (memberStatus) match.memberStatus = memberStatus;
		if (memberType) match.memberType = memberType;

		const result = await this.memberModel
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

	public async updateMemberByAdmin(input: MemberUpdate): Promise<Member> {
		const result = await this.memberModel.findOneAndUpdate({ _id: input._id }, input, { new: true }).exec();

		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async memberStatsEditor(input: StatisticModifier): Promise<Member> {
		const { _id, targetKey, modifier } = input;
		return await this.memberModel.findByIdAndUpdate(_id, { $inc: { [targetKey]: modifier } }, { new: true }).exec();
	}

	public async getAdminId(): Promise<ObjectId> {
		const admin = await this.memberModel.findOne({ memberType: MemberType.ADMIN }).exec();

		return admin._id;
	}
}
