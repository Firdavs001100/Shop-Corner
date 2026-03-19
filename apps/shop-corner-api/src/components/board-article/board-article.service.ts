import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { BoardArticle, BoardArticles } from '../../libs/dto/board-article/board-article';
import { MemberService } from '../member/member.service';
import { ViewService } from '../view/view.service';
import {
	AllBoardArticlesInquiry,
	BoardArticleInput,
	BoardArticlesInquiry,
} from '../../libs/dto/board-article/board-article.input';
import { Message } from '../../libs/Errors';
import { StatisticModifier, T } from '../../libs/types/common';
import { BoardArticleStatus } from '../../libs/enums/board-article.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { BoardArticleUpdate } from '../../libs/dto/board-article/board-article.update';
import { Direction } from '../../libs/enums/common.enum';
import { lookupAuthMemberLiked, lookupMember, shapeIntoMongooseObjectId } from '../../libs/config';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { LikeService } from '../like/like.service';
import { NotificationInput } from '../../libs/dto/notification/notification.input';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class BoardArticleService {
	constructor(
		@InjectModel('BoardArticle') private readonly boardArticleModel: Model<BoardArticle>,
		private readonly memberService: MemberService,
		private readonly viewService: ViewService,
		private readonly likeService: LikeService,
		private readonly notificationService: NotificationService,
	) {}

	// USER
	public async createBoardArticle(input: BoardArticleInput): Promise<BoardArticle> {
		try {
			const result = await this.boardArticleModel.create(input);

			await this.memberService.memberStatsEditor({ _id: result.memberId, targetKey: 'memberArticles', modifier: 1 });

			return result;
		} catch (err) {
			console.log('Error, boardArticles.service.ts--createBoardArticle:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getBoardArticle(memberId: ObjectId, articleId: ObjectId): Promise<BoardArticle> {
		const search: T = {
			_id: articleId,
			articleStatus: BoardArticleStatus.ACTIVE,
		};

		let targetBoardArticle: BoardArticle = await this.boardArticleModel.findOne(search).exec();
		if (!targetBoardArticle) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const viewInput = { memberId, viewRefId: articleId, viewGroup: ViewGroup.ARTICLE },
				newView = await this.viewService.viewRecord(viewInput);
			if (newView) {
				targetBoardArticle = await this.boardArticleStatsEditor({
					_id: articleId,
					targetKey: 'articleViews',
					modifier: 1,
				});
			}

			const input: LikeInput = {
				memberId,
				likeRefId: articleId,
				likeGroup: LikeGroup.ARTICLE,
			};
			targetBoardArticle.meLiked = await this.likeService.checkLikeExistance(input);
		}

		targetBoardArticle.memberData = await this.memberService.getMember(null, targetBoardArticle.memberId);
		return targetBoardArticle;
	}

	public async updateBoardArticle(memberId: ObjectId, input: BoardArticleUpdate): Promise<BoardArticle> {
		const { _id, articleStatus } = input,
			search: T = {
				_id,
				memberId,
				// articleStatus: BoardArticleStatus.ACTIVE,
			};

		const result = await this.boardArticleModel.findOneAndUpdate(search, input, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (articleStatus === BoardArticleStatus.DELETE) {
			await this.memberService.memberStatsEditor({ _id: memberId, targetKey: 'memberArticles', modifier: -1 });
		}

		return result;
	}

	public async likeTargetArticle(memberId: ObjectId, likeRefId: ObjectId): Promise<BoardArticle> {
		const target: BoardArticle = await this.boardArticleModel
			.findOne({ _id: likeRefId, articleStatus: BoardArticleStatus.ACTIVE })
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = {
			memberId,
			likeRefId,
			likeGroup: LikeGroup.ARTICLE,
		};

		// like toggle logic via like service model
		const { modifier, isLiked } = await this.likeService.toggleLike(input),
			result = await this.boardArticleStatsEditor({ _id: likeRefId, targetKey: 'articleLikes', modifier });
		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);

		const notificationInput: NotificationInput = {
			notificationType: NotificationType.LIKE,
			notificationGroup: NotificationGroup.ARTICLE,
			notificationTitle: 'Someone liked your article',
			notificationDesc: `Someone liked your article: "${target.articleTitle}".`,
			authorId: memberId,
			receiverId: target.memberId,
			articleId: target._id,
		};

		// create notification via notification service model
		if (isLiked && target.memberId.toString() !== memberId.toString())
			await this.notificationService.createNotification(notificationInput);
		if (!isLiked) await this.notificationService.deleteLikeNotification(memberId, likeRefId, NotificationGroup.ARTICLE);

		return result;
	}

	public async getBoardArticles(memberId: ObjectId, input: BoardArticlesInquiry): Promise<BoardArticles> {
		const { articleCategory, text } = input.search,
			match: T = { articleStatus: BoardArticleStatus.ACTIVE },
			sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (articleCategory) match.articleCategory = articleCategory;
		if (text) match.articleTitle = { $regex: new RegExp(text, 'i') };
		if (input.search?.memberId) match.memberId = shapeIntoMongooseObjectId(input.search.memberId);

		const result = await this.boardArticleModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupAuthMemberLiked(memberId),
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result[0].list.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	// ADMIN

	public async getAllBoardArticlesByAdmin(memberId: ObjectId, input: AllBoardArticlesInquiry): Promise<BoardArticles> {
		const { articleCategory, articleStatus } = input.search,
			match: T = {},
			sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (articleCategory) match.articleCategory = articleCategory;
		if (articleStatus) match.articleStatus = articleStatus;

		const result = await this.boardArticleModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupAuthMemberLiked(memberId),
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result[0].list.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async updateBoardArticleByAdmin(input: BoardArticleUpdate): Promise<BoardArticle> {
		const { _id, articleStatus } = input,
			search: T = {
				_id,
			};

		const result = await this.boardArticleModel.findOneAndUpdate(search, input, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (articleStatus === BoardArticleStatus.DELETE) {
			await this.memberService.memberStatsEditor({ _id, targetKey: 'memberArticles', modifier: -1 });
		}

		return result;
	}

	public async removeBoardArticleByAdmin(articleId: ObjectId): Promise<BoardArticle> {
		const search: T = {
			_id: articleId,
			articleStatus: BoardArticleStatus.DELETE,
		};

		const result = await this.boardArticleModel.findOneAndDelete(search).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}

	// Stats editor
	public async boardArticleStatsEditor(input: StatisticModifier): Promise<BoardArticle> {
		const { _id, targetKey, modifier } = input;
		return await this.boardArticleModel
			.findByIdAndUpdate(_id, { $inc: { [targetKey]: modifier } }, { new: true })
			.exec();
	}
}
