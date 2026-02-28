import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Like, MeLiked } from '../../libs/dto/like/like';
import { LikeInput } from '../../libs/dto/like/like.input';
import { Message } from '../../libs/Errors';
import { T } from '../../libs/types/common';
import { LikeGroup } from '../../libs/enums/like.enum';
import { OrdinaryInquiry } from '../../libs/dto/product/product.input';
import { Products } from '../../libs/dto/product/product';

@Injectable()
export class LikeService {
	constructor(@InjectModel('Like') private readonly likeModel: Model<Like>) {}

	public async toggleLike(input: LikeInput): Promise<{ modifier: number; isLiked: boolean }> {
		const { memberId, likeRefId } = input;
		const search = { memberId, likeRefId };

		const exist = await this.likeModel.findOne(search).exec();

		if (exist) {
			await this.likeModel.findOneAndDelete(search).exec();
			return { modifier: -1, isLiked: false };
		}

		try {
			await this.likeModel.create(input);
			return { modifier: 1, isLiked: true };
		} catch (err) {
			console.log('ERROR, Service.model:', err.message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async checkLikeExistance(input: LikeInput): Promise<MeLiked[]> {
		const { memberId, likeRefId } = input,
			result = await this.likeModel.findOne({ memberId, likeRefId }).exec();

		return result ? [{ memberId, likeRefId, myFavorite: true }] : [];
	}

	public async getFavoriteProducts(memberId: ObjectId, input: OrdinaryInquiry): Promise<Products> {
		const { page, limit } = input,
			match: T = { memberId, likeGroup: LikeGroup.PRODUCT };

		const data: T = await this.likeModel
				.aggregate([
					{ $match: match },
					{ $sort: { updatedAt: -1 } },
					{
						$lookup: {
							from: 'products',
							localField: 'likeRefId',
							foreignField: '_id',
							as: 'favoriteProduct',
						},
					},
					{ $unwind: '$favoriteProduct' },
					{
						$facet: {
							list: [
								{ $skip: (page - 1) * limit },
								{ $limit: limit }, //
							],
							metaCounter: [{ $count: 'total' }],
						},
					},
				])
				.exec(),
			result: Products = { list: [], metaCounter: data[0].metaCounter };
		result.list = data[0].list.map((ele: any) => ele.favoriteProduct);

		return result;
	}
}
