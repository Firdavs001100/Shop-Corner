import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Comment, Comments } from '../../libs/dto/comment/comment';
import { MemberService } from '../member/member.service';
import { BoardArticleService } from '../board-article/board-article.service';
import { AllCommentsInquiry, CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';
import { Message } from '../../libs/Errors';
import { CommentGroup, CommentStatus } from '../../libs/enums/comment.enum';
import { CommentUpdate } from '../../libs/dto/comment/comment.update';
import { T } from '../../libs/types/common';
import { lookupAuthMemberLiked, lookupMember } from '../../libs/config';
import { Direction } from '../../libs/enums/common.enum';
import { ProductService } from '../product/product.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationGroup, NotificationType } from '../../libs/enums/notification.enum';

@Injectable()
export class CommentService {
	constructor(
		@InjectModel('Comment') private readonly commentModel: Model<Comment>,
		private readonly memberService: MemberService,
		private readonly productService: ProductService,
		private readonly boardArticleService: BoardArticleService,
		private readonly notificationService: NotificationService,
	) {}

	// USER
	public async createComment(input: CommentInput): Promise<Comment> {
		let result: Comment;
		try {
			result = await this.commentModel.create(input);
		} catch (err) {
			console.log('Error, comment.service.ts--createComment:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}

		if (!result) throw new BadRequestException(Message.CREATE_FAILED);

		switch (input.commentGroup) {
			case CommentGroup.MEMBER: {
				await this.memberService.memberStatsEditor({
					_id: input.commentRefId,
					targetKey: 'memberComments',
					modifier: 1,
				});

				const targetMember = await this.memberService.getMember(null, input.commentRefId);

				if (targetMember._id.toString() !== input.memberId.toString()) {
					await this.notificationService.createNotification({
						notificationType: NotificationType.COMMENT,
						notificationGroup: NotificationGroup.MEMBER,
						notificationTitle: 'New comment on your profile',
						notificationDesc: `${targetMember.memberNick} commented on your profile`,
						authorId: input.memberId,
						receiverId: targetMember._id,
					});
				}

				break;
			}

			case CommentGroup.ARTICLE: {
				await this.boardArticleService.boardArticleStatsEditor({
					_id: input.commentRefId,
					targetKey: 'articleComments',
					modifier: 1,
				});

				const article = await this.boardArticleService.getBoardArticle(null, input.commentRefId);

				if (article.memberId.toString() !== input.memberId.toString()) {
					await this.notificationService.createNotification({
						notificationType: NotificationType.COMMENT,
						notificationGroup: NotificationGroup.ARTICLE,
						notificationTitle: 'New comment on your article',
						notificationDesc: `Someone commented on your article: "${article.articleTitle}"`,
						authorId: input.memberId,
						receiverId: article.memberId,
						articleId: article._id,
					});
				}

				break;
			}

			case CommentGroup.PRODUCT: {
				await this.productService.productStatsEditor({
					_id: input.commentRefId,
					targetKey: 'productComments',
					modifier: 1,
				});

				const productComments = await this.commentModel
					.find({
						commentRefId: input.commentRefId,
						commentGroup: CommentGroup.PRODUCT,
					})
					.select('commentRating');

				const total = productComments.length;
				const avg = total > 0 ? productComments.reduce((sum, c) => sum + (c.commentRating ?? 0), 0) / total : 0;

				await this.productService.updateProductRating(input.commentRefId, parseFloat(avg.toFixed(1)));

				break;
			}
		}

		return result;
	}

	public async updateComment(memberId: ObjectId, input: CommentUpdate): Promise<Comment> {
		const { _id } = input;
		const search: T = {
			_id,
			memberId,
			commentStatus: CommentStatus.ACTIVE,
		};

		const result = await this.commentModel.findOneAndUpdate(search, input, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	public async getComments(memberId: ObjectId, input: CommentsInquiry): Promise<Comments> {
		const { commentRefId } = input.search,
			match: T = { commentRefId, commentStatus: CommentStatus.ACTIVE },
			sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result = await this.commentModel
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
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async getAllComments(memberId: ObjectId, input: AllCommentsInquiry): Promise<Comments> {
		const { commentGroup, commentRating } = input.search,
			match: T = { commentStatus: CommentStatus.ACTIVE },
			sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (commentGroup) match.commentGroup = commentGroup;
		if (commentRating) match.commentRating = { $gte: commentRating };

		const result = await this.commentModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: 100 },
							{ $sample: { size: input.limit } },
							lookupAuthMemberLiked(memberId),
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	// ADMIN
	public async removeCommentByAdmin(commentId: ObjectId): Promise<Comment> {
		const result = await this.commentModel.findByIdAndDelete(commentId).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}
}
