import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { t } from '../../common/validation/i18n-message.js';

export class CreateUserDto {
  @IsNotEmpty({ message: t('IS_NOT_EMPTY') })
  @IsString({ message: t('IS_STRING') })
  @MaxLength(50, { message: t('MAX_LENGTH') })
  username: string;

  @IsNotEmpty({ message: t('IS_NOT_EMPTY') })
  @IsEmail({}, { message: t('IS_EMAIL') })
  email: string;

  @IsNotEmpty({ message: t('IS_NOT_EMPTY') })
  @IsString({ message: t('IS_STRING') })
  @MinLength(8, { message: t('MIN_LENGTH') })
  password: string;
}

/** Request body per the RealWorld spec: { "user": { ... } } */
export class RegisterRequestDto {
  @IsDefined({ message: t('IS_NOT_EMPTY') })
  @ValidateNested()
  @Type(() => CreateUserDto)
  user: CreateUserDto;
}
