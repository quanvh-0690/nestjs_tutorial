import { Type } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { t } from '../../common/validation/i18n-message.js';

/**
 * The avatar is NOT accepted through the "image" field as a URL; a real file is uploaded instead
 * (the "image" field is a file in multipart/form-data).
 */
export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: t('IS_EMAIL') })
  email?: string;

  @IsOptional()
  @IsString({ message: t('IS_STRING') })
  @MaxLength(50, { message: t('MAX_LENGTH') })
  username?: string;

  @IsOptional()
  @IsString({ message: t('IS_STRING') })
  @MinLength(8, { message: t('MIN_LENGTH') })
  password?: string;

  @IsOptional()
  @IsString({ message: t('IS_STRING') })
  @MaxLength(1000, { message: t('MAX_LENGTH') })
  bio?: string;
}

/**
 * Body JSON:      { "user": { "bio": "..." } }
 * Body multipart: user[bio]=...&user[email]=... + file "image"
 *   (Multer turns "user[bio]" into the nested object { user: { bio } })
 */
export class UpdateUserRequestDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateUserDto)
  user?: UpdateUserDto;
}
