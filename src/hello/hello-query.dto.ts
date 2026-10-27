import { IsOptional, IsString, MaxLength } from 'class-validator';
import { t } from '../common/validation/i18n-message.js';

export class HelloQueryDto {
  /** Name of the person to greet */
  @IsOptional()
  @IsString({ message: t('IS_STRING') })
  @MaxLength(50, { message: t('MAX_LENGTH') })
  name?: string;
}
