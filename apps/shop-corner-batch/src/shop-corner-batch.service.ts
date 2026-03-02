import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from 'apps/shop-corner-api/src/libs/dto/product/product';
import { ProductStatus } from 'apps/shop-corner-api/src/libs/enums/product.enum';
import { Model } from 'mongoose';

@Injectable()
export class ShopCornerBatchService {
	constructor(@InjectModel('Product') private readonly productModel: Model<Product>) {}

	public async batchRollback(): Promise<void> {
		await this.productModel.updateMany({ productStatus: ProductStatus.ACTIVE }, { productRank: 0 }).exec();
	}

	public async batchTopProducts(): Promise<void> {
		const products: Product[] = await this.productModel.find({
			productStatus: ProductStatus.ACTIVE,
			productRank: 0,
		});

		const promisedList = products.map(async (ele: Product) => {
			const { _id, productSales, productLikes, productViews } = ele,
				rank = productSales * 4 + productLikes * 2 + productViews * 1;

			return await this.productModel.findByIdAndUpdate(_id, { productRank: rank }).exec();
		});

		await Promise.all(promisedList);
	}

	getHello(): string {
		return 'This is the ShopCorner BATCH SERVER!';
	}
}
