/*
 * Per-scene shared state. World owns the frame loop; parts register what they need:
 *   - updaters: called once per rendered frame, after the camera moved
 *   - labels:   DOM captions anchored to a world point (rendered by Labels.svelte)
 *   - hoverables: points the pointer can pick (hover on desktop, tap on touch)
 */
import { writable } from 'svelte/store';
import { Vector3 } from 'three';

import { createSharedUniforms } from './gl/materials.js';
import { createShot } from './story.js';

/**
 * @typedef {{ en: string, ru: string }} Text
 * @typedef {{ key: string, kind: string, text: Text, sub?: Text }} LabelDef
 * @typedef {{ world: Vector3, opacity: number, el: HTMLElement | null, x: number, y: number, o: number }} LabelState
 * @typedef {{
 *   key: string, title: Text, text?: Text, sub?: Text, world: Vector3,
 *   weight: () => number, setHover: (on: boolean) => void
 * }} Hoverable
 */

/** @param {import('./quality.js').SceneQuality} quality */
export const createRuntime = (quality) => {
	/** @type {import('svelte/store').Writable<LabelDef[]>} */
	const labelDefs = writable([]);
	/** @type {Map<string, LabelState>} */
	const labels = new Map();

	return {
		quality,
		motion: !quality.reducedMotion,
		/** @type {import('three').PerspectiveCamera} */
		camera: /** @type {any} */ (null),
		/** @type {'wide' | 'tall'} */
		layout: 'wide',
		layoutStore: writable(/** @type {'wide' | 'tall'} */ ('wide')),
		uniforms: createSharedUniforms(),
		shot: createShot(),
		/** smoothed story time */
		T: 0,
		phases: { skills: -1, process: -1, intro: 0 },
		/** @type {Set<(runtime: any) => void>} */
		updaters: new Set(),
		/** @type {Set<Hoverable>} */
		hoverables: new Set(),
		labels,
		labelDefs,
		/** @type {import('svelte/store').Writable<Hoverable | null>} */
		hover: writable(null),
		hoverCard: { el: /** @type {HTMLElement | null} */ (null), x: -1, y: -1, o: 0 },
		lang: writable(/** @type {'en' | 'ru'} */ ('en')),
		/** asks for a frame in on-demand (reduced motion) mode */
		requestRender: () => {},
		/** reduced motion: called when the section changes (the shell fades the new still in) */
		onCut: /** @type {(() => void) | undefined} */ (undefined),

		/** @param {LabelDef} def */
		addLabel(def) {
			const state = { world: new Vector3(), opacity: 0, el: null, x: -1, y: -1, o: -1 };
			labels.set(def.key, state);
			labelDefs.update((list) => [...list.filter((item) => item.key !== def.key), def]);
			return state;
		},

		/** @param {string} key */
		removeLabel(key) {
			labels.delete(key);
			labelDefs.update((list) => list.filter((item) => item.key !== key));
		}
	};
};

/** @typedef {ReturnType<typeof createRuntime>} Runtime */
