import { Schema } from 'mongoose';
import { ProductCategory, ProductDressStyle, ProductSize, ProductStatus } from '../libs/enums/product.enum';

const ProductSchema = new Schema(
	{
		productStatus: {
			type: String,
			enum: ProductStatus,
			default: ProductStatus.DRAFT,
			index: true,
			required: true,
		},

		productName: {
			type: String,
			required: true,
			trim: true,
		},

		productSlug: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},

		productDesc: {
			type: String,
			required: true,
		},

		productCategory: {
			type: String,
			enum: ProductCategory,
			required: true,
			index: true,
		},

		productDressStyle: {
			type: String,
			enum: ProductDressStyle,
			required: true,
			index: true,
		},

		productPrice: {
			type: Number,
			required: true,
			min: 0,
		},

		productSalePrice: {
			type: Number,
			min: 0,
		},

		productSize: {
			type: String,
			enum: ProductSize,
			required: true,
			index: true,
		},

		productColor: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},

		productMaterial: {
			type: String,
			trim: true,
		},

		productBrand: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},

		productImages: {
			type: [String],
			required: true,
			validate: [(v: string[]) => v.length > 0, 'At least one image is required'],
		},

		productStockCount: {
			type: Number,
			required: true,
			min: 0,
		},

		productViews: {
			type: Number,
			default: 0,
			min: 0,
		},

		productLikes: {
			type: Number,
			default: 0,
			min: 0,
		},

		productRank: {
			type: Number,
			default: 0,
			min: 0,
		},

		productSales: {
			type: Number,
			default: 0,
			min: 0,
		},

		productsTags: {
			type: [String],
			default: [],
			index: true,
		},

		isDiscounted: {
			type: Boolean,
			default: false,
			index: true,
		},
	},
	{ timestamps: true },
);

/* INDEXES */

// Unique product slug
ProductSchema.index({ productSlug: 1 }, { unique: true });

// Prevent duplicates in same category
ProductSchema.index({ productName: 1, productCategory: 1 }, { unique: true });

// Shop filters
ProductSchema.index({ productCategory: 1, productStatus: 1 });
ProductSchema.index({ productDressStyle: 1 });
ProductSchema.index({ productSize: 1 });
ProductSchema.index({ productBrand: 1 });
ProductSchema.index({ productColor: 1 });

// Text search
ProductSchema.index({
	productName: 'text',
	productDesc: 'text',
	productsTags: 'text',
});

export default ProductSchema;
