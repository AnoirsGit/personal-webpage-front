<!--
	Skills as named constellations: the five groups of buildConstellations()
	(content.skill-tree.js), the same groups and skills as the Skills list, laid out by
	../data/constellations.js. Scroll through the skills section drives
	`runtime.phases.skills`: within each figure stars light up in breadth-first order from
	the lead and every line draws towards the star it leads to. Hovering (or tapping) a star
	shows its title and one-line summary, captioned in the page language.

	When the Skills section shows the list (sceneStore.skillsView = 'list') the figures step
	back to a faint trace, lose their captions and stop answering the pointer.
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
	/** what is left of the figures while the list is shown */
	const LIST_TRACE = 0.12;
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

	/** 1 while the sky is the Skills view, eases to 0 while the list is shown */
	let sky = runtime.skillsList ? 0 : 1;

	/** one record per star, rebuilt with the layout */
	let records = [];
	const names = figures.map((figure) => ({
		figure,
		window: /** @type {[number, number]} */ ([0, 1]),
		state: runtime.addLabel({ key: `sky:${figure.id}`, kind: 'constellation', text: figure.name })
	}));

	/** @param {'wide' | 'tall'} layout */
	const build = (layout) => {
		const anchor = SKY_ANCHOR[layout];
		const glow = [];
		const flow = [];
		const nextRecords = [];

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
				nextRecords.push({ star, figure, world: positions[i], window: windows[i] });
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

			const top = Math.max(...figure.stars.map((star) => star.y));
			skyPoint(
				anchor,
				place.yaw,
				place.pitch,
				DISTANCE,
				place.size,
				place.size,
				0,
				top + 0.16,
				names[f].state.world
			);
			names[f].window = [w0, w0 + span * 0.35];
		});

		const oldStars = stars.geometry;
		const oldLines = lines.geometry;
		stars.geometry = buildGlowPoints(glow);
		lines.geometry = buildFlowLines(flow);
		oldStars.dispose();
		oldLines.dispose();

		records.forEach((record) => runtime.hoverables.delete(record.hoverable));
		records = nextRecords.map((record, index) => {
			const hoverable = {
				key: `sky:${record.figure.id}:${record.star.key}`,
				title: record.star.title,
				text: record.star.text.en ? record.star.text : undefined,
				sub: record.figure.name,
				world: record.world,
				weight: () => smoothstep(record.window[0], record.window[1], runtime.phases.skills) * sky,
				setHover: (on) => {
					starMaterial.uniforms.uHover.value = on ? index : -1;
				}
			};
			runtime.hoverables.add(hoverable);
			return { ...record, hoverable };
		});
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
		// the list view: ease the sky out (a cut with reduced motion)
		const now = performance.now();
		const dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 1;
		lastNow = now;
		const target = rt.skillsList ? 0 : 1;
		sky = rt.motion ? sky + (target - sky) * Math.min(1, dt * 5) : target;
		if (Math.abs(sky - target) < 0.002) sky = target;

		const phase = rt.phases.skills;
		starMaterial.uniforms.uPhase.value = phase;
		lineMaterial.uniforms.uPhase.value = phase;
		// full strength while the skills are the subject, softer behind the process graph,
		// a faint memory behind later sections; a trace only under the list
		const focus = 1 - smoothstep(3.0, 3.4, rt.T);
		const fade =
			(0.3 + 0.7 * focus) *
			(1 - 0.45 * smoothstep(1.85, 2.2, rt.T) * focus) *
			(LIST_TRACE + (1 - LIST_TRACE) * sky);
		starMaterial.uniforms.uFade.value = fade;
		lineMaterial.uniforms.uFade.value = fade;
		// names belong to the skills section: gone once the process takes over
		const named = (1 - smoothstep(1.8, 2.1, rt.T)) * sky;
		for (const name of names) {
			name.state.opacity = smoothstep(name.window[0], name.window[1], phase) * 0.9 * named;
		}
	};
	runtime.updaters.add(update);

	onDestroy(() => {
		runtime.updaters.delete(update);
		records.forEach((record) => runtime.hoverables.delete(record.hoverable));
		figures.forEach((figure) => runtime.removeLabel(`sky:${figure.id}`));
	});
</script>

<T is={lines} />
<T is={stars} />
