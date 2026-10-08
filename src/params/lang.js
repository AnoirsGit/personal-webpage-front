/** Only the two published locales are routes; anything else is a 404. */
export const match = (param) => param === 'en' || param === 'ru';
