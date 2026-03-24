import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { View } from '../../libs/dto/view/view';
import { ViewInput } from '../../libs/dto/view/view.input';
import { T } from '../../libs/types/common';
import { ViewGroup } from '../../libs/enums/view.enum';
import { OrdinaryInquiry } from '../../libs/dto/product/product.input';
import { Products } from '../../libs/dto/product/product';
import { lookupAuthMemberLiked } from '../../libs/config';

@Injectable()
export class ViewService {
	constructor(@InjectModel('View') private readonly viewModel: Model<View>) {}

	public async viewRecord(input: ViewInput): Promise<View | null> {
		const viewExist = await this.checkViewExistence(input);

		if (!viewExist) {
			console.log('-- NEW VIEW INSERTED --');
			return await this.viewModel.create(input);
		} else return null;
	}

	private async checkViewExistence(input: ViewInput): Promise<View> {
		const { memberId, viewRefId } = input;
		const search: T = { memberId, viewRefId };

		return this.viewModel.findOne(search).exec();
	}

	public async getVisitedProducts(memberId: ObjectId, input: OrdinaryInquiry): Promise<Products> {
		const { page, limit } = input,
			match: T = { memberId, viewGroup: ViewGroup.PRODUCT };

		const data = await this.viewModel
				.aggregate([
					{ $match: match },
					{ $sort: { updatedAt: -1 } },

					{
						$facet: {
							list: [
								{ $skip: (page - 1) * limit },
								{ $limit: limit },

								{
									$lookup: {
										from: 'products',
										localField: 'viewRefId',
										foreignField: '_id',
										as: 'visitedProduct',
									},
								},
								{ $unwind: '$visitedProduct' },
								lookupAuthMemberLiked(memberId, '$visitedProduct._id'),
								{
									$addFields: {
										'visitedProduct.meLiked': '$meLiked',
									},
								},
							],
							metaCounter: [{ $count: 'total' }],
						},
					},
				])
				.exec(),
			result: Products = { list: [], metaCounter: data[0].metaCounter };
		result.list = data[0].list.map((ele: any) => ele.visitedProduct);

		return result;
	}
}
