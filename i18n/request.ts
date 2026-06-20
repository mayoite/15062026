import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';
import {defaultLocale} from './config';

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale =
    requested && routing.locales.includes(requested)
      ? requested
      : defaultLocale;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
