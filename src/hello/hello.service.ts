import { Injectable } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class HelloService {
  greet(name = 'World'): string {
    // I18nContext.current() resolves the current request's language (?lang=, Accept-Language)
    const i18n = I18nContext.current();
    return i18n ? i18n.t('common.HELLO', { args: { name } }) : `Hello ${name}!`;
  }
}
