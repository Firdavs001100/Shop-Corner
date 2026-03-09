import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { MemberService } from '../member/member.service';
import { Message } from '../../libs/Errors';
import { StatisticModifier, T } from '../../libs/types/common';
import { ViewGroup } from '../../libs/enums/view.enum';
import { ViewService } from '../view/view.service';
import { Direction } from '../../libs/enums/common.enum';
import { lookupAuthMemberLiked } from '../../libs/config';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { Product, Products } from '../../libs/dto/product/product';
import { ProductStatus } from '../../libs/enums/product.enum';
import {
	AllProductsInquiry,
	OrdinaryInquiry,
	ProductInput,
	ProductsInquiry,
} from '../../libs/dto/product/product.input';
import { ProductUpdate } from '../../libs/dto/product/product.update';
import slugify from 'slugify';
import { OrderItem } from '../../libs/dto/order/order';

@Injectable()
export class ProductService {
	constructor(
		@InjectModel('Product') private readonly productModel: Model<Product>,
		private readonly memberService: MemberService,
		private readonly viewService: ViewService,
		private readonly likeService: LikeService,
	) {}

	public async getProduct(memberId: ObjectId, productId: ObjectId): Promise<Product> {
		const search: T = {
			_id: productId,
			productStatus: ProductStatus.ACTIVE,
		};

		let targetProduct: Product = await this.productModel.findOne(search).lean().exec();
		if (!targetProduct) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const viewInput = { memberId, viewRefId: productId, viewGroup: ViewGroup.PRODUCT },
				newView = await this.viewService.viewRecord(viewInput);
			if (newView) {
				targetProduct = await this.productStatsEditor({ _id: productId, targetKey: 'productViews', modifier: 1 });
			}

			const input: LikeInput = {
				memberId,
				likeRefId: productId,
				likeGroup: LikeGroup.PRODUCT,
			};
			targetProduct.meLiked = await this.likeService.checkLikeExistance(input);
		}
		return targetProduct;
	}

	public async getProducts(memberId: ObjectId, input: ProductsInquiry): Promise<Products> {
		const match: T = { productStatus: ProductStatus.ACTIVE },
			sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		this.shapeMatchQuery(match, input);
		console.log('match:', match);

		const result = await this.productModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupAuthMemberLiked(memberId),
							//
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	private shapeMatchQuery(match: T, input: ProductsInquiry): void {
		const { categoryList, sizeList, brandList, colorList, dressStyleList, pricesRange, text } = input.search;

		if (categoryList && categoryList.length) match.productCategory = { $in: categoryList };
		if (sizeList && sizeList.length) match.productSize = { $in: sizeList };
		if (brandList && brandList.length) match.productBrand = { $in: brandList };
		if (colorList && colorList.length) match.productColor = { $in: colorList };
		if (dressStyleList && dressStyleList.length) match.productDressStyle = { $in: dressStyleList };

		if (pricesRange) match.productPrice = { $gte: pricesRange.start, $lte: pricesRange.end };

		if (text) match.productName = { $regex: new RegExp(text, 'i') };
	}

	public async getFavorites(memberId: ObjectId, input: OrdinaryInquiry): Promise<Products> {
		return await this.likeService.getFavoriteProducts(memberId, input);
	}

	public async getVisited(memberId: ObjectId, input: OrdinaryInquiry): Promise<Products> {
		return await this.viewService.getVisitedProducts(memberId, input);
	}

	public async likeTargetProduct(memberId: ObjectId, likeRefId: ObjectId): Promise<Product> {
		const target: Product = await this.productModel
			.findOne({ _id: likeRefId, productStatus: ProductStatus.ACTIVE })
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = {
			memberId,
			likeRefId,
			likeGroup: LikeGroup.PRODUCT,
		};

		// like toggle logic via like service model
		const { modifier } = await this.likeService.toggleLike(input),
			result = await this.productStatsEditor({ _id: likeRefId, targetKey: 'productLikes', modifier });
		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);

		return result;
	}

	public async createProductByAdmin(input: ProductInput): Promise<Product> {
		try {
			// Generate base slug from product name
			const baseSlug = slugify(input.productName, {
				lower: true,
				strict: true,
				trim: true,
			});

			let slug = baseSlug;
			let count = 1;

			while (await this.productModel.exists({ productSlug: slug })) {
				slug = `${baseSlug}-${count++}`;
			}

			const result = await this.productModel.create({
				...input,
				productSlug: slug,
			});

			return result;
		} catch (err) {
			console.log('Error, product.service.ts--createProductByAdmin:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getAllProductsByAdmin(input: AllProductsInquiry): Promise<Products> {
		const { productStatus, productCategoryList } = input.search;
		const match: T = {},
			sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		if (productStatus) match.productStatus = productStatus;
		if (productCategoryList) match.productCategory = { $in: productCategoryList };
		const result = await this.productModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							//
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	public async updateProductByAdmin(input: ProductUpdate): Promise<Product> {
		if (input.productName) {
			input.productSlug = slugify(input.productName, {
				lower: true,
				strict: true,
			});
		}

		const result = await this.productModel.findOneAndUpdate({ _id: input._id }, input, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	public async removeProductByAdmin(productId: ObjectId): Promise<Product> {
		const result = await this.productModel.findOneAndDelete({ _id: productId }).exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}

	public async productStatsEditor(input: StatisticModifier): Promise<Product> {
		const { _id, targetKey, modifier } = input;
		return await this.productModel.findByIdAndUpdate(_id, { $inc: { [targetKey]: modifier } }, { new: true }).exec();
	}

	public async updateProductOrderStats(orderItems: OrderItem[]): Promise<void> {
		const ops = orderItems.map((item) => ({
			updateOne: {
				filter: {
					_id: item.productId,
					productStockCount: { $gte: item.itemQuantity },
				},
				update: {
					$inc: {
						productSales: item.itemQuantity,
						productStockCount: -item.itemQuantity,
					},
				},
			},
		}));

		const result = await this.productModel.bulkWrite(ops);

		if (result.modifiedCount !== orderItems.length) {
			throw new BadRequestException('Some products are out of stock');
		}
	}
}
