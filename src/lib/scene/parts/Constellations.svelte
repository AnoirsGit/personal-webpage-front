<!--
	Skills as named constellations (data: ../data/constellations.js). Scroll through the
	skills section drives `runtime.phases.skills`: within each figure stars light up in
	breadth-first order from the hub and every line draws towards the star it leads to.
	Hovering (or tapping) a star shows its title and the short definition from the tree.
-->
<script>
	import { onDestroy } from 'svelte';
	import { T } from '@threlte/core';
	import { BufferGeometry, Mesh, Points, Vector3 } from 'three';

	import { buildConstellations } from '../data/constellations.js';
	import { SCENE_TEXT } from '../sceneText.js';
	import { CONSTELLATION_PLACEMENT, SKY_ANCHOR, skyPoint } from '../story.js';
	import { buildFlowLines, buildGlowPoints } from '../gl/geometry.js';
	import { createFlowLineMaterial, createGlowPointMaterial } from '../gl/materials.js';

	/** @type {import('../runtime.js').Runtime} */
	export let runtime;

	const DISTANCE = 48;
	const figures = buildConstellations();

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

	/** one record per star, rebuilt with the layout */
	let records = [];
	const names = figures.map((figure) => ({
		figure,
		window: /** @type {[number, number]} */ ([0, 1]),
		state: runtime.addLabel({
			key: `sky:${figure.id}`,
			kind: 'constellation',
			text: {
				en: SCENE_TEXT.en.constellations[figure.id],
				ru: SCENE_TEXT.ru.constellations[figure.id]
			}
		})
	}));

	/** @param {'wide' | 'tall'} layout */
	const build = (layout) => {
		const anchor = SKY_ANCHOR[layout];
		const glow = [];
		const flow = [];
		const nextRecords = [];

		figures.forEach((figure, f) => {
			const place = CONSTELLATION_PLACEMENT[layout][figure.id];
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
					size: star.mag === 1 ? 5.6 : star.mag > 0.7 ? 4 : 3.3,
					window: windows[i],
					kind: 0,
					seed: (f * 0.37 + i * 0.13) % 1
				});
				nextRecords.push({ star, figure, world: positions[i], window: windows[i] });
			});
			for (const [a, b] of figure.edges) {
				const [start] = windows[b];
				flow.push({
					points: [...positions[a].toArray(), ...positions[b].toArray()],
					reveal: [Math.max(windows[a][0] + span * 0.08, start - span * 0.22), start + span * 0.04],
					width: 1.05,
					base: 0.34
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
				sub: {
					en: SCENE_TEXT.en.constellations[record.figure.id],
					ru: SCENE_TEXT.ru.constellations[record.figure.id]
				},
				world: record.world,
				weight: () => smoothstep(record.window[0], record.window[1], runtime.phases.skills),
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

	/** @param {import('../runtime.js').Runtime} rt */
	const update = (rt) => {
		if (rt.layout !== layout) {
			layout = rt.layout;
			build(layout);
		}
		const phase = rt.phases.skills;
		starMaterial.uniforms.uPhase.value = phase;
		lineMaterial.uniforms.uPhase.value = phase;
		// full strength while the skills are the subject, softer behind the process graph,
		// a faint memory behind later sections
		const focus = 1 - smoothstep(3.0, 3.4, rt.T);
		const fade = (0.3 + 0.7 * focus) * (1 - 0.45 * smoothstep(1.85, 2.2, rt.T) * focus);
		starMaterial.uniforms.uFade.value = fade;
		lineMaterial.uniforms.uFade.value = fade;
		for (const name of names) {
			name.state.opacity = smoothstep(name.window[0], name.window[1], phase) * 0.9 * focus;
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
