// PartialType from @nestjs/swagger = the @nestjs/mapped-types one + keeps metadata for the API docs
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, ValidateNested } from 'class-validator';
import { t } from '../../common/validation/i18n-message.js';
import { CreateArticleDto } from './create-article.dto.js';

/** PartialType: copies every field + validator of CreateArticleDto, all made optional */
export class UpdateArticleDto extends PartialType(CreateArticleDto) {}

export class UpdateArticleRequestDto {
  @IsDefined({ message: t('IS_NOT_EMPTY') })
  @ValidateNested()
  @Type(() => UpdateArticleDto)
  article: UpdateArticleDto;
}
