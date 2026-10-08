/*
 * Structured data for one language version of the page, as one JSON-LD @graph:
 * Person, WebSite, WebPage, a Service per work format and the FAQPage.
 * Everything comes from the same sources as the visible page — the dictionaries,
 * the site config (location) and the skill tree — so the two cannot drift apart.
 */
import { translate } from '$lib/shared/i18n';
import { home, homeParams } from '$lib/shared/i18n/location.js';
import { SITE_URL, PERSON, OG_IMAGE, localeUrl, absoluteUrl } from './site.js';

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * @param {'en' | 'ru'} code
 * @param {{ groups?: { stars: { title: string }[] }[], facts?: Record<string, unknown> }} [context]
 */
export const buildJsonLd = (code, { groups = [], facts = {} } = {}) => {
	const tr = (key) => translate(code, key, facts);
	const pageUrl = localeUrl(code);
	const { city, country } = homeParams(code);

	const address = {
		'@type': 'PostalAddress',
		addressLocality: city,
		addressCountry: home.countryIso3
	};

	const person = {
		'@type': 'Person',
		'@id': PERSON_ID,
		name: tr('meta.siteName'),
		alternateName: [PERSON.name, ...PERSON.alternateNames].filter(
			(name) => name !== tr('meta.siteName')
		),
		jobTitle: tr('meta.jobTitle'),
		description: tr('meta.description'),
		url: pageUrl,
		image: absoluteUrl(PERSON.portrait),
		email: `mailto:${PERSON.email}`,
		telephone: PERSON.phone,
		address,
		homeLocation: {
			'@type': 'Place',
			name: `${city}, ${country}`,
			address,
			geo: { '@type': 'GeoCoordinates', latitude: home.lat, longitude: home.lon }
		},
		sameAs: [PERSON.github, PERSON.linkedin],
		// the leading skills of every constellation, straight from the skill tree
		knowsAbout: groups.flatMap((group) => group.stars.slice(0, 6).map((star) => star.title))
	};

	const website = {
		'@type': 'WebSite',
		'@id': WEBSITE_ID,
		url: `${SITE_URL}/`,
		name: tr('meta.siteName'),
		inLanguage: ['en', 'ru'],
		publisher: { '@id': PERSON_ID }
	};

	const webpage = {
		'@type': 'WebPage',
		'@id': `${pageUrl}#webpage`,
		url: pageUrl,
		name: tr('meta.title'),
		description: tr('meta.description'),
		inLanguage: code,
		isPartOf: { '@id': WEBSITE_ID },
		about: { '@id': PERSON_ID },
		primaryImageOfPage: {
			'@type': 'ImageObject',
			url: absoluteUrl(OG_IMAGE.path(code)),
			width: OG_IMAGE.width,
			height: OG_IMAGE.height
		}
	};

	const services = tr('offer.formats').map((format) => ({
		'@type': 'Service',
		'@id': `${pageUrl}#service-${format.id}`,
		name: format.name,
		serviceType: format.name,
		description: [format.text, ...format.points].join(' '),
		provider: { '@id': PERSON_ID },
		areaServed: [
			{ '@type': 'City', name: city },
			{ '@type': 'Country', name: country }
		],
		url: `${pageUrl}#offer`
	}));

	const faq = {
		'@type': 'FAQPage',
		'@id': `${pageUrl}#faq`,
		url: pageUrl,
		inLanguage: code,
		isPartOf: { '@id': WEBSITE_ID },
		mainEntity: tr('faq.items').map(({ q, a }) => ({
			'@type': 'Question',
			name: q,
			acceptedAnswer: { '@type': 'Answer', text: a }
		}))
	};

	return {
		'@context': 'https://schema.org',
		'@graph': [person, website, webpage, ...services, faq]
	};
};

/** JSON that is safe inside <script type="application/ld+json">. */
export const serializeJsonLd = (data) =>
	JSON.stringify(data)
		.replace(/</g, '\\u003c')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');
