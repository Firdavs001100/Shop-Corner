import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';
import { ProductCategory, ProductDressStyle, ProductSize, ProductStatus } from '../../enums/product.enum';
import { productSortOptions } from '../../config';

@InputType()
export class ProductInput {
	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => ProductStatus)
	productStatus: ProductStatus;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	productName: string;

	@IsNotEmpty()
	@Length(5, 1000)
	@Field(() => String)
	productDesc: string;

	@IsNotEmpty()
	@Field(() => ProductCategory)
	productCategory: ProductCategory;

	@IsNotEmpty()
	@Field(() => ProductDressStyle)
	productDressStyle: ProductDressStyle;

	@IsNotEmpty()
	@Field(() => Float)
	productPrice: number;

	@IsOptional()
	@Field(() => Float, { nullable: true })
	productSalePrice?: number;

	@IsNotEmpty()
	@Field(() => [ProductSize])
	productSize: ProductSize[];

	@IsNotEmpty()
	@Field(() => [String])
	productColor: string[];

	@IsOptional()
	@Field(() => String, { nullable: true })
	productMaterial?: string;

	@IsNotEmpty()
	@Field(() => String)
	productBrand: string;

	@IsNotEmpty()
	@Field(() => [String])
	productImages: string[];

	@IsNotEmpty()
	@Field(() => Int)
	productStockCount: number;

	@IsNotEmpty()
	@Field(() => [String])
	productTags: string[];

	@IsNotEmpty()
	@Field(() => Boolean)
	isDiscounted: boolean;
}

@InputType()
export class PricesRange {
	@Field(() => Int)
	start: number;

	@Field(() => Int)
	end: number;
}

@InputType()
export class PISearch {
	@IsOptional()
	@Field(() => [ProductCategory], { nullable: true })
	categoryList?: ProductCategory[];

	@IsOptional()
	@Field(() => [ProductSize], { nullable: true })
	sizeList?: ProductSize[];

	@IsOptional()
	@Field(() => [String], { nullable: true })
	brandList?: string[];

	@IsOptional()
	@Field(() => [String], { nullable: true })
	colorList?: string[];

	@IsOptional()
	@Field(() => [ProductDressStyle], { nullable: true })
	dressStyleList?: ProductDressStyle[];

	@IsOptional()
	@Field(() => PricesRange, { nullable: true })
	pricesRange?: PricesRange;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class ProductsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(productSortOptions)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => PISearch)
	search: PISearch;
}

@InputType()
export class OrdinaryInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;
}

@InputType()
export class ALPISearch {
	@IsOptional()
	@Field(() => ProductStatus, { nullable: true })
	productStatus?: ProductStatus;

	@IsOptional()
	@Field(() => [ProductCategory], { nullable: true })
	productCategoryList?: ProductCategory[];
}

@InputType()
export class AllProductsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(productSortOptions)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ALPISearch)
	search: ALPISearch;
}
