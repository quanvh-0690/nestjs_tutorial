import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { t } from '../../common/validation/i18n-message.js';

export class LoginDto {
  @IsNotEmpty({ message: t('IS_NOT_EMPTY') })
  @IsEmail({}, { message: t('IS_EMAIL') })
  email: string;

  @IsNotEmpty({ message: t('IS_NOT_EMPTY') })
  @IsString({ message: t('IS_STRING') })
  password: string;
}

export class LoginRequestDto {
  @IsDefined({ message: t('IS_NOT_EMPTY') })
  @ValidateNested()
  @Type(() => LoginDto)
  user: LoginDto;
}
