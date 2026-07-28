/*
 * Locale-aware content stores.
 *
 * Prose lives in per-locale mock files (works, about-me). The skill tree is
 * the exception: its geometry is large and hand-positioned, so `tree.json`
 * stays the single source of truth and `tree.ru.json` only overlays the
 * translatable `title` / `description` of each node by id.
 */
import { derived } from 'svelte/store';

import { byLocale, locale, DEFAULT_LOCALE } from './index.js';

import worksEn from '$lib/shared/mocks/works.en.json';
import worksRu from '$lib/shared/mocks/works.ru.json';
import aboutMeEn from '$lib/shared/mocks/about-me.en.json';
import aboutMeRu from '$lib/shared/mocks/about-me.ru.json';
import tree from '$lib/shared/mocks/tree.json';
import treeRu from '$lib/shared/mocks/tree.ru.json';

export const works = byLocale({ en: worksEn, ru: worksRu });

export const aboutMe = byLocale({ en: aboutMeEn.aboutMe, ru: aboutMeRu.aboutMe });

const TREE_OVERLAYS = { ru: treeRu };

const applyOverlay = (branch, overlay) => {
	if (!overlay) return branch;

	return {
		...branch,
		nodes: branch.nodes.map((node) => {
			const translation = overlay[String(node.id)];
			return translation ? { ...node, ...translation } : node;
		})
	};
};

export const skillTree = derived(locale, ($locale) => {
	const overlay = TREE_OVERLAYS[$locale];
	if (!overlay || $locale === DEFAULT_LOCALE) return tree;

	return Object.fromEntries(
		Object.entries(tree).map(([key, branch]) => [key, applyOverlay(branch, overlay[key])])
	);
});
