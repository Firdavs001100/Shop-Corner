import { Field, InputType, Int, Float } from '@nestjs/graphql';
import { IsArray, ArrayNotEmpty, IsInt, IsOptional, Length, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import { ProductCategory, ProductDressStyle, ProductSize, ProductStatus } from '../../enums/product.enum';

@InputType()
export class ProductUpdate {
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => ProductStatus, { nullable: true })
	productStatus?: ProductStatus;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	productName?: string;

	productSlug?: string;

	@IsOptional()
	@Length(5, 1000)
	@Field(() => String, { nullable: true })
	productDesc?: string;

	@IsOptional()
	@Field(() => ProductCategory, { nullable: true })
	productCategory?: ProductCategory;

	@IsOptional()
	@Field(() => ProductDressStyle, { nullable: true })
	productDressStyle?: ProductDressStyle;

	@IsOptional()
	@Min(0)
	@Field(() => Float, { nullable: true })
	productPrice?: number;

	@IsOptional()
	@Min(0)
	@Field(() => Float, { nullable: true })
	productSalePrice?: number;

	@IsOptional()
	@Field(() => [ProductSize], { nullable: true })
	productSize?: ProductSize[];

	@IsOptional()
	@Length(2, 50)
	@Field(() => [String], { nullable: true })
	productColor?: string[];

	@IsOptional()
	@Length(2, 50)
	@Field(() => String, { nullable: true })
	productMaterial?: string;

	@IsOptional()
	@Length(2, 50)
	@Field(() => String, { nullable: true })
	productBrand?: string;

	@IsOptional()
	@IsArray()
	@ArrayNotEmpty()
	@Field(() => [String], { nullable: true })
	productImages?: string[];

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	productStockCount?: number;

	@IsOptional()
	@IsArray()
	@ArrayNotEmpty()
	@Field(() => [String], { nullable: true })
	productTags?: string[];

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	isDiscounted?: boolean;
}
