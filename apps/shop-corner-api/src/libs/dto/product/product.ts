import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import { TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';
import { ProductCategory, ProductDressStyle, ProductSize, ProductStatus } from '../../enums/product.enum';

@ObjectType()
export class Product {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => ProductStatus)
	productStatus: ProductStatus;

	@Field(() => String)
	productName: string;

	@Field(() => String)
	productSlug: string;

	@Field(() => String)
	productDesc: string;

	@Field(() => ProductCategory)
	productCategory: ProductCategory;

	@Field(() => ProductDressStyle)
	productDressStyle: ProductDressStyle;

	@Field(() => Float)
	productPrice: number;

	@Field(() => Float, { nullable: true })
	productSalePrice?: number;

	@Field(() => [ProductSize])
	productSize: ProductSize[];

	@Field(() => [String])
	productColor: string[];

	@Field(() => String, { nullable: true })
	productMaterial?: string;

	@Field(() => String)
	productBrand: string;

	@Field(() => [String])
	productImages: string[];

	@Field(() => Int)
	productStockCount: number;

	@Field(() => Int)
	productViews: number;

	@Field(() => Int)
	productLikes: number;

	@Field(() => [String])
	productTags: string[];

	@Field(() => Int)
	productRank: number;

	@Field(() => Int)
	productSales: number;

	@Field(() => Boolean)
	isDiscounted: boolean;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation **/

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];
}

@ObjectType()
export class Products {
	@Field(() => [Product])
	list: Product[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter?: TotalCounter[];
}
