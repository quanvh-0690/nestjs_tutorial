import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  ValidationError,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  I18nContext,
  I18nValidationException,
  I18nValidationExceptionFilter,
} from 'nestjs-i18n';

type ErrorBody = { errors: Record<string, string[]> };

/**
 * Convert validation errors to RealWorld format: { email: ["email is invalid"], ... }
 * Nested body { user: { email } } => key is still "email" (leaf field name).
 */
function formatValidationErrors(
  errors: ValidationError[],
): Record<string, string[]> {
  return errors.reduce<Record<string, string[]>>((acc, error) => {
    if (error.constraints) {
      acc[error.property] = Object.values(error.constraints);
    }
    if (error.children?.length) {
      Object.assign(acc, formatValidationErrors(error.children));
    }
    return acc;
  }, {});
}

/**
 * Filter handling ALL exceptions (~ app/Exceptions/Handler.php in Laravel).
 * Error responses always follow the RealWorld spec:
 *   { "errors": { "body": ["message"] } }
 * If the message is an i18n key (e.g. "article.NOT_FOUND") it is translated to the request language.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  // DTO validation errors: reuse the nestjs-i18n filter to translate messages
  private readonly validationFilter = new I18nValidationExceptionFilter({
    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    errorFormatter: (errors) => formatValidationErrors(errors),
    responseBodyFormatter: (_host, _exc, formattedErrors) => ({
      errors: formattedErrors,
    }),
  });

  catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof I18nValidationException) {
      return this.validationFilter.catch(exception, host);
    }

    const response = host.switchToHttp().getResponse<Response>();
    const i18n = I18nContext.current(host);
    const translate = (key: string, args?: Record<string, unknown>) =>
      i18n ? (i18n.t(key, { args }) as string) : key;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorBody = {
      errors: { body: [translate('common.INTERNAL_ERROR')] },
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        response.status(status).json({
          errors: { body: [translate('common.TOO_MANY_REQUESTS')] },
        });
        return;
      }
      const res = exception.getResponse();
      // Allows: throw new NotFoundException('article.NOT_FOUND')
      // or: throw new UnprocessableEntityException({ errors: { email: ['user.EMAIL_TAKEN'] } })
      if (typeof res === 'object' && res !== null && 'errors' in res) {
        const errors = (res as ErrorBody).errors;
        body = {
          errors: Object.fromEntries(
            Object.entries(errors).map(([field, messages]) => [
              field,
              messages.map((m) => translate(m)),
            ]),
          ),
        };
      } else {
        const message =
          typeof res === 'string'
            ? res
            : ((res as { message?: string | string[] }).message ??
              exception.message);
        const messages = Array.isArray(message) ? message : [message];
        body = { errors: { body: messages.map((m) => translate(m)) } };
      }
    } else {
      this.logger.error(exception);
    }

    response.status(status).json(body);
  }
}
