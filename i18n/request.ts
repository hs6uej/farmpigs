import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  // Get locale from cookie or default to 'th'
  let locale = await requestLocale;
  
  if (!locale) {
    locale = 'th';
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
