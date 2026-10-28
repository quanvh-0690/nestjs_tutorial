import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { t } from '../../common/validation/i18n-message.js';

export class CreateArticleDto {
  @IsNotEmpty({ message: t('IS_NOT_EMPTY') })
  @IsString({ message: t('IS_STRING') })
  @MaxLength(255, { message: t('MAX_LENGTH') })
  title: string;

  @IsOptional()
  @IsString({ message: t('IS_STRING') })
  @MaxLength(500, { message: t('MAX_LENGTH') })
  description?: string;

  @IsNotEmpty({ message: t('IS_NOT_EMPTY') })
  @IsString({ message: t('IS_STRING') })
  body: string;

  @IsOptional()
  @IsArray({ message: t('IS_ARRAY') })
  @IsString({ each: true, message: t('IS_STRING') })
  tagList?: string[];
}

export class CreateArticleRequestDto {
  @IsDefined({ message: t('IS_NOT_EMPTY') })
  @ValidateNested()
  @Type(() => CreateArticleDto)
  article: CreateArticleDto;
}
