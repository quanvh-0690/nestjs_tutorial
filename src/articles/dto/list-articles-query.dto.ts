import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { t } from '../../common/validation/i18n-message.js';

/** GET /api/articles?tag=&author=&favorited=&search=&limit=&offset= */
export class ListArticlesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ message: t('IS_STRING') })
  tag?: string;

  @IsOptional()
  @IsString({ message: t('IS_STRING') })
  author?: string;

  /** username of the user who favorited the article */
  @IsOptional()
  @IsString({ message: t('IS_STRING') })
  favorited?: string;

  /** Keyword search in title/description/body */
  @IsOptional()
  @IsString({ message: t('IS_STRING') })
  @MaxLength(100, { message: t('MAX_LENGTH') })
  search?: string;
}
