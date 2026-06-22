import {getRequestConfig} from 'next-intl/server';
import {cookies, headers} from 'next/headers';
import {defaultLocale, locales, Locale} from './config';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const nextLocale = cookieStore.get('NEXT_LOCALE')?.value;
  
  let locale: Locale = defaultLocale;
  
  if (nextLocale && (locales as readonly string[]).includes(nextLocale)) {
    locale = nextLocale as Locale;
  } else {
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language');
    if (acceptLanguage) {
      const preferred = acceptLanguage.split(',')[0].split('-')[0];
      if ((locales as readonly string[]).includes(preferred)) {
        locale = preferred as Locale;
      }
    }
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
