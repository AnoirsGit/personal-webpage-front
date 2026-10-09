/*
 * The skills sky. The groups, their names, the skills in them and every hover text come
 * from one source, buildConstellations(lang) in src/lib/shared/i18n/content.skill-tree.js —
 * the same five groups the Skills list shows. This module decides no grouping of its own;
 * it only lays each group out as a figure (./skyLayout.js).
 *
 * buildConstellations is called once per language and the two results are zipped by id, so
 * every caption exists in both languages and the sky follows the page language live.
 *
 * Star brightness: the group's first skill (its lead) is the brightest, the group's main
 * tools (`main`) are bright, the rest are faint.
 */
import { buildConstellations } from '$lib/shared/i18n/content.skill-tree.js';

import { layoutFigure } from './skyLayout.js';

const MAX_TEXT = 132;

/** Hover text: the skill's one-line summary, cut at a word if it runs long. */
const clip = (text = '') => {
	if (text.length <= MAX_TEXT) return text;
	const cut = text.slice(0, MAX_TEXT);
	return cut.slice(0, Math.max(cut.lastIndexOf(' '), 60)).replace(/[,;:—-]+$/, '') + '…';
};

/**
 * @typedef {{ en: string, ru: string }} Text
 * @typedef {{
 *   key: string, x: number, y: number, depth: number, order: number, mag: number,
 *   title: Text, text: Text
 * }} Star
 * @typedef {{ id: string, name: Text, stars: Star[], edges: [number, number][] }} Figure
 */

/** @returns {Figure[]} */
export const buildSkyFigures = () => {
	const en = buildConstellations('en');
	const ru = new Map(buildConstellations('ru').map((group) => [group.id, group]));

	return en.map((group) => {
		const other = ru.get(group.id) ?? group;
		const otherStars = new Map(other.stars.map((star) => [star.id, star]));
		const index = new Map(group.stars.map((star, i) => [star.id, i]));
		/** @type {[number, number][]} */
		const links = [];
		for (const [from, to] of group.links) {
			const a = index.get(from);
			const b = index.get(to);
			if (a !== undefined && b !== undefined) links.push([a, b]);
		}
		const { points, edges } = layoutFigure(
			group.stars.map((star) => ({ key: `${group.id}:${star.id}`, x: star.x, y: star.y })),
			links
		);

		return {
			id: group.id,
			name: { en: group.name, ru: other.name },
			stars: group.stars.map((star, i) => {
				const translated = otherStars.get(star.id) ?? star;
				return {
					key: star.id,
					...points[i],
					mag: i === 0 ? 1 : star.main ? 0.72 : 0.5,
					title: { en: star.title, ru: translated.title },
					text: { en: clip(star.summary), ru: clip(translated.summary || star.summary) }
				};
			}),
			edges
		};
	});
};
