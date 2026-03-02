import { Controller, Get, Logger } from '@nestjs/common';
import { ShopCornerBatchService } from './shop-corner-batch.service';
import { Cron, Timeout } from '@nestjs/schedule';
import { BATCH_ROLLBACK, BATCH_TOP_PRODUCTS } from '../lib/config';

@Controller()
export class ShopCornerBatchController {
	private logger: Logger = new Logger('BatchController');

	constructor(private readonly batchService: ShopCornerBatchService) {}

	@Timeout(1000)
	public async handleTimeout() {
		this.logger.debug('BATCH SERVER READY!');
	}

	@Cron('00 * * * * *', { name: BATCH_ROLLBACK })
	public async batchRollback() {
		try {
			this.logger['context'] = BATCH_ROLLBACK;
			this.logger.debug('EXECUTED!');
			this.batchService.batchRollback();
		} catch (err) {
			this.logger.error('Batch error:', err);
		}
	}

	@Cron('20 * * * * *', { name: BATCH_TOP_PRODUCTS })
	public async batchTopProducts() {
		try {
			this.logger['context'] = BATCH_TOP_PRODUCTS;
			this.logger.debug('EXECUTED!');
			this.batchService.batchTopProducts();
		} catch (err) {
			this.logger.error('Batch error:', err);
		}
	}

	@Get()
	getHello(): string {
		return this.batchService.getHello();
	}
}
