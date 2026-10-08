/*
 * Feeds the 3D scene: publishes `{ section, progress }` to `sceneStore` while the
 * page scrolls (contract in src/lib/scene/sceneStore.js).
 *
 * Page sections map onto the six scene stages in order; the FAQ shares the last
 * stage with the contact block. A stage spans from the top of its first element to
 * the top of the next stage, so there are no gaps between stages.
 *
 * Progress is measured at a reading line that slides from the top of the viewport
 * (page top) to its bottom (page end). That way the hero starts at exactly 0, the
 * contact stage ends at exactly 1, and `stage index + progress` only ever grows.
 *
 * Other fields of the store (e.g. `skillsView`) are left as they are. The current
 * stage is also mirrored on <html data-scene="…"> (only when it changes), as a CSS
 * hook for the static poster and for checking the tracker from a test.
 */
import { sceneStore } from '$lib/scene/sceneStore.js';

/** [element id, scene stage] in page order. */
export const SECTION_STAGES = [
	['hero', 'hero'],
	['skills', 'skills'],
	['process', 'process'],
	['works', 'works'],
	['offer', 'offer'],
	['faq', 'contact'],
	['contact', 'contact']
];

const clamp01 = (value) => Math.min(Math.max(value, 0), 1);

/** Starts tracking; returns the cleanup (fits `onMount(() => trackSceneProgress())`). */
export function trackSceneProgress(stages = SECTION_STAGES) {
	const elements = stages
		.map(([id, stage]) => [document.getElementById(id), stage])
		.filter(([element]) => element);
	if (!elements.length) return () => {};

	let starts = [];
	let docHeight = 0;
	let frame = 0;
	let last = null;

	// stage boundaries move only when the layout does, not on every scroll frame
	const layout = () => {
		const scroll = window.scrollY;
		starts = [];
		for (const [element, stage] of elements) {
			const top = element.getBoundingClientRect().top + scroll;
			if (!starts.length || starts[starts.length - 1].stage !== stage) starts.push({ stage, top });
		}
		starts[0].top = 0; // the first stage also owns the header above it
		docHeight = document.documentElement.scrollHeight;
	};

	const publish = () => {
		frame = 0;
		const viewport = window.innerHeight;
		const scroll = window.scrollY;
		const line = scroll + viewport * clamp01(scroll / Math.max(docHeight - viewport, 1));

		let index = starts.length - 1;
		while (index > 0 && starts[index].top > line) index -= 1;
		const start = starts[index].top;
		const end = index + 1 < starts.length ? starts[index + 1].top : docHeight;
		const section = starts[index].stage;
		const progress = clamp01((line - start) / Math.max(end - start, 1));

		if (last && last.section === section && Math.abs(last.progress - progress) < 0.0005) return;
		if (last?.section !== section) document.documentElement.dataset.scene = section;
		last = { section, progress };
		sceneStore.update((state) => ({ ...state, section, progress }));
	};

	const schedule = () => {
		if (!frame) frame = requestAnimationFrame(publish);
	};

	const relayout = () => {
		layout();
		schedule();
	};

	const resizeObserver =
		typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(relayout);
	resizeObserver?.observe(document.body);
	window.addEventListener('scroll', schedule, { passive: true });
	window.addEventListener('resize', relayout, { passive: true });

	layout();
	publish();

	return () => {
		cancelAnimationFrame(frame);
		resizeObserver?.disconnect();
		window.removeEventListener('scroll', schedule);
		window.removeEventListener('resize', relayout);
	};
}
