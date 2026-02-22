import { Module } from '@nestjs/common';
import { CozyCornerController } from './app.controller';
import { CozyCornerService } from './app.service';

@Module({
	imports: [],
	controllers: [CozyCornerController],
	providers: [CozyCornerService],
})
export class CozyCornerModule {}
