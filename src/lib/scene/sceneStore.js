/*
 * Contract between the page and the 3D background.
 *
 *   sceneStore: writable({ section, progress })
 *     section  — 'hero' | 'skills' | 'process' | 'works' | 'offer' | 'contact'
 *     progress — 0..1, how far the reader is through that section
 *
 * The page owns the store; the scene only reads it and never touches the DOM of the
 * sections, so the layout is free to change. Write it however you like, or put
 * `use:sceneSection={'skills'}` on each section element and the store follows scroll:
 * the section under the reading line (middle of the viewport) wins, and progress is
 * how far that line has travelled through it.
 *
 * This module imports nothing from three.js, so it is safe in the entry chunk.
 */
import { writable } from 'svelte/store';

/** @typedef {'hero' | 'skills' | 'process' | 'works' | 'offer' | 'contact'} SceneSection */
/** @typedef {{ section: SceneSection, progress: number }} SceneState */

/** Story order. The scene treats `index + progress` as one continuous timeline. */
export const SCENE_SECTIONS = ['hero', 'skills', 'process', 'works', 'offer', 'contact'];

/** @type {import('svelte/store').Writable<SceneState>} */
export const sceneStore = writable({ section: 'hero', progress: 0 });

const clamp01 = (value) => (value > 0 ? (value < 1 ? value : 1) : 0);

/** @param {string} section */
export const sectionIndex = (section) => Math.max(0, SCENE_SECTIONS.indexOf(section));

/**
 * One number for the whole story: hero 0..1, skills 1..2, … contact 5..6.
 * @param {SceneState} state
 */
export const storyTime = ({ section, progress }) =>
	sectionIndex(section) + clamp01(Number(progress) || 0);

/* ---------------------------------------------------------------------------------- */
/* Optional scroll tracking: `use:sceneSection={'works'}` on a section element.        */
/* ---------------------------------------------------------------------------------- */

/** Fraction of the viewport height where the reading line sits. */
const READING_LINE = 0.5;

/** @type {Map<Element, SceneSection>} */
const tracked = new Map();
let frame = 0;
let current = { section: 'hero', progress: 0 };

const measure = () => {
	frame = 0;
	const line = window.innerHeight * READING_LINE;
	let containing = null;
	let passed = null;
	let passedTop = -Infinity;
	let first = null;
	let firstTop = Infinity;

	for (const [element, section] of tracked) {
		const rect = element.getBoundingClientRect();
		if (rect.height <= 0) continue;
		if (rect.top < firstTop) {
			firstTop = rect.top;
			first = section;
		}
		if (rect.top <= line && rect.bottom > line) {
			containing = { section, progress: (line - rect.top) / rect.height };
			break;
		}
		// Gaps between sections: stay on the last section whose top the line has passed.
		if (rect.top <= line && rect.top > passedTop) {
			passedTop = rect.top;
			passed = { section, progress: 1 };
		}
	}

	const next = containing ?? passed ?? (first ? { section: first, progress: 0 } : null);
	if (!next) return;
	next.progress = clamp01(next.progress);
	if (next.section === current.section && Math.abs(next.progress - current.progress) < 0.0005) {
		return;
	}
	current = next;
	sceneStore.set(next);
};

const schedule = () => {
	if (!frame) frame = requestAnimationFrame(measure);
};

const listen = (on) => {
	const method = on ? 'addEventListener' : 'removeEventListener';
	window[method]('scroll', schedule, { passive: true });
	window[method]('resize', schedule, { passive: true });
};

/**
 * Svelte action: marks an element as a story section for the scene.
 * @param {Element} node
 * @param {SceneSection} section
 */
export function sceneSection(node, section) {
	if (tracked.size === 0) listen(true);
	tracked.set(node, section);
	schedule();

	return {
		/** @param {SceneSection} next */
		update(next) {
			tracked.set(node, next);
			schedule();
		},
		destroy() {
			tracked.delete(node);
			if (tracked.size === 0) {
				listen(false);
				if (frame) cancelAnimationFrame(frame);
				frame = 0;
			} else {
				schedule();
			}
		}
	};
}
