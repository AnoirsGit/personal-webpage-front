/*
 * Skill-tree geometry. `tree.json` is large and hand-positioned, so it stays
 * the single source of truth and `tree.ru.json` only overlays the translatable
 * `title` / `description` of each node by id.
 *
 * Reached only from the lazily-imported SkillTreePanel — together the two files
 * are ~150 kB, which is why they are kept off the entry chunk.
 */
import { derived } from 'svelte/store';

import { locale, DEFAULT_LOCALE } from './index.js';

import tree from '$lib/shared/mocks/tree.json';
import treeRu from '$lib/shared/mocks/tree.ru.json';

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
