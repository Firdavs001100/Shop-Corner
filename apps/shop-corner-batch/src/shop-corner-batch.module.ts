import { Module } from '@nestjs/common';
import { ShopCornerBatchController } from './shop-corner-batch.controller';
import { ShopCornerBatchService } from './shop-corner-batch.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import ProductSchema from 'apps/shop-corner-api/src/schemas/Product.model';

@Module({
	imports: [
		ConfigModule.forRoot(),
		DatabaseModule,
		ScheduleModule.forRoot(),
		MongooseModule.forFeature([{ name: 'Product', schema: ProductSchema }]),
	],
	controllers: [ShopCornerBatchController],
	providers: [ShopCornerBatchService],
})
export class ShopCornerBatchModule {}
