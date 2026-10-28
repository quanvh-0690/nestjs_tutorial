import { Type } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { t } from '../../common/validation/i18n-message.js';

export class CreateCommentDto {
  @IsNotEmpty({ message: t('IS_NOT_EMPTY') })
  @IsString({ message: t('IS_STRING') })
  @MaxLength(5000, { message: t('MAX_LENGTH') })
  body: string;
}

export class CreateCommentRequestDto {
  @IsDefined({ message: t('IS_NOT_EMPTY') })
  @ValidateNested()
  @Type(() => CreateCommentDto)
  comment: CreateCommentDto;
}
