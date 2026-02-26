import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CommentService } from './comment.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Comment, Comments } from '../../libs/dto/comment/comment';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { CommentInput, CommentsInquiry } from '../../libs/dto/comment/comment.input';
import type { ObjectId } from 'mongoose';
import { CommentUpdate } from '../../libs/dto/comment/comment.update';
import { shapeIntoMongooseObjectId } from '../../libs/config';
import { WithoutGuard } from '../auth/guards/without.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';

@Resolver()
export class CommentResolver {
	constructor(private readonly commentService: CommentService) {}

	/** USER **/
	@UseGuards(WithoutGuard)
	@Query(() => Comments)
	public async getComments(
		@Args('input') input: CommentsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Comments> {
		console.log('Query: getComments');
		input.search.commentRefId = shapeIntoMongooseObjectId(input.search.commentRefId);

		return await this.commentService.getComments(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Comment)
	public async createComment(
		@Args('input') input: CommentInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Comment> {
		console.log('Mutation: createComment');
		input.memberId = memberId;

		return await this.commentService.createComment(input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Comment)
	public async updateComment(
		@Args('input') input: CommentUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Comment> {
		console.log('Mutation: updateComment');
		input._id = shapeIntoMongooseObjectId(input._id);

		return await this.commentService.updateComment(memberId, input);
	}

	/** ADMIN **/
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Comment)
	public async removeCommentByAdmin(@Args('commentId') input: string): Promise<Comment> {
		console.log('Mutation: removeCommentByAdmin');
		const commentId = shapeIntoMongooseObjectId(input);

		return await this.commentService.removeCommentByAdmin(commentId);
	}
}
