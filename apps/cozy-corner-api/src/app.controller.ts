import { Controller, Get } from '@nestjs/common';
import { CozyCornerService } from './app.service';

@Controller()
export class CozyCornerController {
	constructor(private readonly cozyCornerService: CozyCornerService) {}

	@Get()
	getHello(): string {
		return this.cozyCornerService.getHello();
	}
}
