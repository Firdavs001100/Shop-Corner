import { NestFactory } from '@nestjs/core';
import { ShopCornerBatchModule } from './shop-corner-batch.module';

async function bootstrap() {
	const app = await NestFactory.create(ShopCornerBatchModule);
	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
