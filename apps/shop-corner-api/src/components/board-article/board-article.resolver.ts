import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BoardArticleService } from './board-article.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { BoardArticle, BoardArticles } from '../../libs/dto/board-article/board-article';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import {
	AllBoardArticlesInquiry,
	BoardArticleInput,
	BoardArticlesInquiry,
} from '../../libs/dto/board-article/board-article.input';
import type { ObjectId } from 'mongoose';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMongooseObjectId } from '../../libs/config';
import { BoardArticleUpdate } from '../../libs/dto/board-article/board-article.update';

@Resolver()
export class BoardArticleResolver {
	constructor(private readonly boardArticleService: BoardArticleService) {}

	/** USER **/
	@UseGuards(WithoutGuard)
	@Query(() => BoardArticle)
	public async getBoardArticle(
		@Args('articleId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<BoardArticle> {
		console.log('Query: getBoardArticle');
		const articleId = shapeIntoMongooseObjectId(input);

		return await this.boardArticleService.getBoardArticle(memberId, articleId);
	}

	@UseGuards(WithoutGuard)
	@Query(() => BoardArticles)
	public async getBoardArticles(
		@Args('input') input: BoardArticlesInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<BoardArticles> {
		console.log('Query: getBoardArticles');

		return await this.boardArticleService.getBoardArticles(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => BoardArticle)
	public async createBoardArticle(
		@Args('input') input: BoardArticleInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<BoardArticle> {
		console.log('Mutation: createBoardArticle');
		input.memberId = memberId;

		return await this.boardArticleService.createBoardArticle(input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => BoardArticle)
	public async updateBoardArticle(
		@Args('input') input: BoardArticleUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<BoardArticle> {
		console.log('Mutation: updateBoardArticle');
		input._id = shapeIntoMongooseObjectId(input._id);

		return await this.boardArticleService.updateBoardArticle(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => BoardArticle)
	public async likeTargetArticle(
		@Args('articleId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<BoardArticle> {
		console.log('Mutation: likeTargetArticle');

		const likeRefId = shapeIntoMongooseObjectId(input);
		return await this.boardArticleService.likeTargetArticle(memberId, likeRefId);
	}

	/** ADMIN **/

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => BoardArticles)
	public async getAllBoardArticlesByAdmin(
		@Args('input') input: AllBoardArticlesInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<BoardArticles> {
		console.log('Query: getAllBoardArticlesByAdmin');

		return await this.boardArticleService.getAllBoardArticlesByAdmin(memberId, input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => BoardArticle)
	public async updateBoardArticleByAdmin(@Args('input') input: BoardArticleUpdate): Promise<BoardArticle> {
		console.log('Mutation: updateBoardArticleByAdmin');
		input._id = shapeIntoMongooseObjectId(input._id);

		return await this.boardArticleService.updateBoardArticleByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => BoardArticle)
	public async removeBoardArticleByAdmin(@Args('articleId') input: string): Promise<BoardArticle> {
		console.log('Mutation: removeBoardArticleByAdmin');
		const articleId = shapeIntoMongooseObjectId(input);

		return await this.boardArticleService.removeBoardArticleByAdmin(articleId);
	}
}
