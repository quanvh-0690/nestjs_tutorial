import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { t } from '../validation/i18n-message.js';

/**
 * Offset/limit pagination per the RealWorld spec:
 *   ?limit=20&offset=40  => page 3 (20 per page)
 * Query string values are always strings => @Type(() => Number) casts them to numbers.
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: t('IS_INT') })
  @Min(1, { message: t('MIN') })
  @Max(100, { message: t('MAX') })
  limit: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: t('IS_INT') })
  @Min(0, { message: t('MIN') })
  offset: number = 0;
}
