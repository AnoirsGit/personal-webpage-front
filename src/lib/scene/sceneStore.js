/*
 * Contract between the page and the 3D background.
 *
 *   sceneStore: writable({ section, progress })
 *     section    — 'hero' | 'skills' | 'process' | 'works' | 'offer' | 'contact'
 *     progress   — 0..1, how far the reader is through that section
 *
 * The page owns the store and writes it with update(), never set():
 * src/lib/sections/sceneProgress.js publishes section and progress on scroll. The scene
 * only reads it and never touches the DOM of the sections, so the layout is free to change.
 * (The skill constellations used to hang in the 3D sky; since 10.2026 the skill tree in the
 * Skills section is the star chart itself, and the sky behind it is just sky.)
 *
 *   sceneStatus: readable-by-the-page { mode, reducedMotion }, written by Scene.svelte
 *     mode — 'pending' (deciding) | 'loading' | 'live' (the 3D runs) | 'poster' (it never will)
 *   The page asks it what the background turned out to be instead of probing WebGL itself:
 *   a WebGL context made on the main thread blocks it for 100–200 ms; the shell probes in a
 *   worker.
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

/** @typedef {{ mode: 'pending' | 'loading' | 'live' | 'poster', reducedMotion: boolean }} SceneStatus */

/** @type {import('svelte/store').Writable<SceneStatus>} */
export const sceneStatus = writable({ mode: 'pending', reducedMotion: false });

const clamp01 = (value) => (value > 0 ? (value < 1 ? value : 1) : 0);

/** @param {string} section */
export const sectionIndex = (section) => Math.max(0, SCENE_SECTIONS.indexOf(section));

/**
 * One number for the whole story: hero 0..1, skills 1..2, … contact 5..6.
 * @param {{ section: string, progress: number }} state
 */
export const storyTime = ({ section, progress }) =>
	sectionIndex(section) + clamp01(Number(progress) || 0);
