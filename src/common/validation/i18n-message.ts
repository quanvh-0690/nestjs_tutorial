import { i18nValidationMessage } from 'nestjs-i18n';

/**
 * Shorthand for i18n validation messages.
 *   @IsEmail({}, { message: t('IS_EMAIL') })  => translates key "validation.IS_EMAIL"
 */
export const t = (key: string) => i18nValidationMessage(`validation.${key}`);
