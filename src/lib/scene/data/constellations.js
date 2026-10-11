/*
 * The skills sky. The groups and the skills in them come from one source,
 * buildConstellations() in src/lib/shared/i18n/content.skill-tree.js — the same five groups
 * the skill tree and the list show. This module decides no grouping of its own; it only lays
 * each group out as a figure (./skyLayout.js).
 *
 * The figures carry no words (the page names every skill in front of them), so one
 * language is enough to lay them out.
 *
 * Star brightness: the group's first skill (its lead) is the brightest, the group's main
 * tools (`main`) are bright, the rest are faint.
 */
import { buildConstellations } from '$lib/shared/i18n/content.skill-tree.js';

import { layoutFigure } from './skyLayout.js';

/**
 * @typedef {{ key: string, x: number, y: number, depth: number, order: number, mag: number }} Star
 * @typedef {{ id: string, stars: Star[], edges: [number, number][] }} Figure
 */

/** @returns {Figure[]} */
export const buildSkyFigures = () =>
	buildConstellations('en').map((group) => {
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
			stars: group.stars.map((star, i) => ({
				key: star.id,
				...points[i],
				mag: i === 0 ? 1 : star.main ? 0.72 : 0.5
			})),
			edges
		};
	});
