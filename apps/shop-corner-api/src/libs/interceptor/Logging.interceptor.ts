import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
	private readonly logger: Logger = new Logger();

	public intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const recordTime = Date.now();
		const requestType = context.getType<GqlContextType>();

		if (requestType === 'http') {
			/* develop a logic for http if needed */
		} else if (requestType === 'graphql') {
			/* (1) PRINT INCOMING REQUEST */
			const gqlContext = GqlExecutionContext.create(context);
			this.logger.verbose(`${this.stringify(gqlContext.getContext().req.body)}`, 'REQUEST');

			/* (2) ERROR HANDLING VIA GRAPHQL */

			/* IF NO ERROR */
			/* (3) PRINT OUTGOING RESPONSE */
			return next.handle().pipe(
				tap((context) => {
					const responseTime = Date.now() - recordTime;
					this.logger.verbose(`${this.stringify(context)} - ${responseTime}ms \n\n`, 'RESPONSE');
				}),
			);
		}
	}

	private stringify(context: ExecutionContext): string {
		return JSON.stringify(context);
		// return JSON.stringify(context).slice(0, 75);
	}
}
