/*
 * Where things happen on the globe.
 *
 * HOME comes from src/lib/config/site-config.json (the owner edits it; the scene follows on
 * the next build): its country is emphasised, its point carries the home marker, every data
 * arc starts there and the globe rests facing it. PLACES are the public work places from
 * the CV and the site; one closer than 150 km to home merges into the home marker.
 */
import siteConfig from '$lib/config/site-config.json';

const finite = (value, fallback) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const wrapLon = (lon) => ((((lon + 180) % 360) + 360) % 360) - 180;

const home = siteConfig?.home ?? {};

export const HOME = {
	iso3: typeof home.countryIso3 === 'string' ? home.countryIso3 : '',
	lat: Math.max(-85, Math.min(85, finite(home.lat, 0))),
	lon: wrapLon(finite(home.lon, 0)),
	/** @type {Record<string, string>} */
	city: home.city ?? {},
	/** @type {Record<string, string>} */
	countryName: home.countryName ?? {},
	timezone: typeof home.timezone === 'string' ? home.timezone : ''
};

/** Public work places (CV): text keys live in sceneText.places. */
const ALL_PLACES = [
	{ id: 'almaty', lat: 43.24, lon: 76.89 },
	{ id: 'astana', lat: 51.17, lon: 71.45 },
	{ id: 'sanfrancisco', lat: 37.77, lon: -122.42 },
	{ id: 'china', lat: 34.5, lon: 104.0 }
];

const DEG = Math.PI / 180;

/** Great-circle distance in km. */
export const distanceKm = (a, b) => {
	const dLat = (b.lat - a.lat) * DEG;
	const dLon = (b.lon - a.lon) * DEG;
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(a.lat * DEG) * Math.cos(b.lat * DEG) * Math.sin(dLon / 2) ** 2;
	return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
};

/** Places that get their own marker and an arc from home. */
export const PLACES = ALL_PLACES.filter((place) => distanceKm(place, HOME) > 150);

/** Place merged into the home marker (its projects join the home label), if any. */
export const HOME_PLACE = ALL_PLACES.find((place) => distanceKm(place, HOME) <= 150) ?? null;
