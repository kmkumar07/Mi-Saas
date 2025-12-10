import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

/**
 * Global exception filter that unwraps and logs details from AggregateError instances
 * before delegating back to Nest's default exception handling.
 */
@Catch()
export class AggregateErrorLoggingFilter extends BaseExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(AggregateErrorLoggingFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        if (exception instanceof AggregateError) {
            this.logger.error('Caught AggregateError. Logging inner errors:');

            const innerErrors = (exception as any).errors;
            if (Array.isArray(innerErrors)) {
                innerErrors.forEach((err, index) => {
                    const message = err?.message ?? String(err);
                    const stack = err?.stack ?? '';
                    this.logger.error(`  [${index}] ${message}`);
                    if (stack) {
                        this.logger.error(stack);
                    }
                });
            } else {
                this.logger.error('AggregateError.errors is not an array; raw value:');
                this.logger.error(JSON.stringify(innerErrors, null, 2));
            }
        }

        // Delegate to Nest's default exception handling so response semantics stay the same
        super.catch(exception, host);
    }
}


