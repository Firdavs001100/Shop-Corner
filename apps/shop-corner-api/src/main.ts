import { NestFactory } from '@nestjs/core';
import { CozyCornerModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(CozyCornerModule);
	await app.listen(process.env.port ?? 3000);
}
bootstrap();
