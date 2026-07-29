/*
 * Timeline prose. Reached only from the lazily-imported ExperienceTimeline, so
 * both locales' `works` JSON stays out of the entry chunk.
 */
import { byLocale } from './index.js';

import worksEn from '$lib/shared/mocks/works.en.json';
import worksRu from '$lib/shared/mocks/works.ru.json';

export const works = byLocale({ en: worksEn, ru: worksRu });
