<!--
	Skills as named constellations: the five groups of buildConstellations()
	(content.skill-tree.js), the same groups and skills as the skill tree in the Skills
	section, laid out by ../data/constellations.js. Scroll through the skills section drives
	`runtime.phases.skills`: within each figure stars light up in breadth-first order from
	the lead and every line draws towards the star it leads to.

	The page shows the skills in front of the sky (sceneStore.skillsView), so the figures are
	decoration: behind the skill tree they stay as a dimmed backdrop, behind the list they
	step back to a faint trace. They carry no captions and do not answer the pointer.
-->
<script>
	import { onDestroy } from 'svelte';
	import { T } from '@threlte/core';
	import { BufferGeometry, Mesh, Points, Vector3 } from 'three';

	import { buildSkyFigures } from '../data/constellations.js';
	import { CONSTELLATION_PLACEMENT, SKY_ANCHOR, skyPoint } from '../story.js';
	import { buildFlowLines, buildGlowPoints } from '../gl/geometry.js';
	import { createFlowLineMaterial, createGlowPointMaterial } from '../gl/materials.js';

	/** @type {import('../runtime.js').Runtime} */
	export let runtime;

	const DISTANCE = 48;
	/** how much of the figures shows behind the skill tree, and behind the list */
	const BACKDROP = { tree: 0.5, list: 0.12 };
	const figures = buildSkyFigures();

	const starMaterial = createGlowPointMaterial(runtime.uniforms);
	const lineMaterial = createFlowLineMaterial(runtime.uniforms);
	const stars = new Points(new BufferGeometry(), starMaterial);
	const lines = new Mesh(new BufferGeometry(), lineMaterial);
	stars.renderOrder = 6;
	lines.renderOrder = 5;

	const smoothstep = (a, b, x) => {
		const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
		return t * t * (3 - 2 * t);
	};

	/** the figures' strength for the current Skills view, eased between views */
	let backdrop = BACKDROP[runtime.skillsView] ?? BACKDROP.tree;

	/** @param {'wide' | 'tall'} layout */
	const build = (layout) => {
		const anchor = SKY_ANCHOR[layout];
		const glow = [];
		const flow = [];

		figures.forEach((figure, f) => {
			const place = CONSTELLATION_PLACEMENT[layout][figure.id];
			if (!place) return;
			const [w0, w1] = place.window;
			const span = w1 - w0;
			const maxDepth = Math.max(1, ...figure.stars.map((star) => star.depth));
			const windows = figure.stars.map((star, i) => {
				const start = w0 + span * 0.6 * (star.depth / maxDepth) + span * 0.06 * ((i * 0.618) % 1);
				return /** @type {[number, number]} */ ([start, start + span * 0.3]);
			});
			const positions = figure.stars.map((star) =>
				skyPoint(
					anchor,
					place.yaw,
					place.pitch,
					DISTANCE,
					place.size,
					place.size,
					star.x,
					star.y,
					new Vector3()
				)
			);

			figure.stars.forEach((star, i) => {
				glow.push({
					position: positions[i].toArray(),
					size: star.mag === 1 ? 5.6 : star.mag > 0.7 ? 4 : 2.8,
					window: windows[i],
					kind: 0,
					seed: (f * 0.37 + i * 0.13) % 1
				});
			});
			for (const [a, b] of figure.edges) {
				const [start] = windows[b];
				// the main tools carry the figure; lines out to the minor skills stay faint
				const minor = Math.min(figure.stars[a].mag, figure.stars[b].mag) < 0.6;
				flow.push({
					points: [...positions[a].toArray(), ...positions[b].toArray()],
					reveal: [Math.max(windows[a][0] + span * 0.08, start - span * 0.22), start + span * 0.04],
					width: minor ? 0.85 : 1.05,
					base: minor ? 0.2 : 0.34
				});
			}
		});

		const oldStars = stars.geometry;
		const oldLines = lines.geometry;
		stars.geometry = buildGlowPoints(glow);
		lines.geometry = buildFlowLines(flow);
		oldStars.dispose();
		oldLines.dispose();
	};

	let layout = runtime.layout;
	build(layout);

	let lastNow = 0;

	/** @param {import('../runtime.js').Runtime} rt */
	const update = (rt) => {
		if (rt.layout !== layout) {
			layout = rt.layout;
			build(layout);
		}
		// ease between the tree's backdrop and the list's trace (a cut with reduced motion)
		const now = performance.now();
		const dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 1;
		lastNow = now;
		const target = BACKDROP[rt.skillsView] ?? BACKDROP.tree;
		backdrop = rt.motion ? backdrop + (target - backdrop) * Math.min(1, dt * 5) : target;
		if (Math.abs(backdrop - target) < 0.002) backdrop = target;

		const phase = rt.phases.skills;
		starMaterial.uniforms.uPhase.value = phase;
		lineMaterial.uniforms.uPhase.value = phase;
		// strongest while the skills are the subject, softer behind the process graph, a faint
		// memory behind later sections — always as a backdrop to the page's own skill view
		const focus = 1 - smoothstep(3.0, 3.4, rt.T);
		const fade = (0.3 + 0.7 * focus) * (1 - 0.45 * smoothstep(1.85, 2.2, rt.T) * focus) * backdrop;
		starMaterial.uniforms.uFade.value = fade;
		lineMaterial.uniforms.uFade.value = fade;
	};
	runtime.updaters.add(update);

	onDestroy(() => runtime.updaters.delete(update));
</script>

<T is={lines} />
<T is={stars} />
