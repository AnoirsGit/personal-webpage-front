/*
 * Contract between the page and the 3D background.
 *
 *   sceneStore: writable({ section, progress, skillsView })
 *     section    — 'hero' | 'skills' | 'process' | 'works' | 'offer' | 'contact'
 *     progress   — 0..1, how far the reader is through that section
 *     skillsView — 'constellations' | 'list': how the Skills section shows the skills.
 *                  With 'list' the sky dims its constellations and their stars stop
 *                  answering the pointer, so nothing competes with the list.
 *
 * The page owns the store and writes it with update(), never set(), so one writer does
 * not wipe another's field: src/lib/sections/sceneProgress.js publishes section and
 * progress on scroll, the Skills section publishes skillsView. The scene only reads it
 * and never touches the DOM of the sections, so the layout is free to change.
 *
 * This module imports nothing from three.js, so it is safe in the entry chunk.
 */
import { writable } from 'svelte/store';

/** @typedef {'hero' | 'skills' | 'process' | 'works' | 'offer' | 'contact'} SceneSection */
/** @typedef {'constellations' | 'list'} SkillsView */
/** @typedef {{ section: SceneSection, progress: number, skillsView: SkillsView }} SceneState */

/** Story order. The scene treats `index + progress` as one continuous timeline. */
export const SCENE_SECTIONS = ['hero', 'skills', 'process', 'works', 'offer', 'contact'];

/** @type {import('svelte/store').Writable<SceneState>} */
export const sceneStore = writable({ section: 'hero', progress: 0, skillsView: 'constellations' });

const clamp01 = (value) => (value > 0 ? (value < 1 ? value : 1) : 0);

/** @param {string} section */
export const sectionIndex = (section) => Math.max(0, SCENE_SECTIONS.indexOf(section));

/**
 * One number for the whole story: hero 0..1, skills 1..2, … contact 5..6.
 * @param {{ section: string, progress: number }} state
 */
export const storyTime = ({ section, progress }) =>
	sectionIndex(section) + clamp01(Number(progress) || 0);
