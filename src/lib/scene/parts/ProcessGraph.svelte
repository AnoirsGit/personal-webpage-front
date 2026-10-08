<!--
	"How I work with AI" as a constellation: orchestrator → role agents → evals → prod, and
	the faint loop a failing gate takes back. It draws along the flow as the process section
	scrolls, then pulses keep running through it — agents handing work on.
-->
<script>
	import { onDestroy } from 'svelte';
	import { T } from '@threlte/core';
	import { BufferGeometry, Mesh, Points, Vector3 } from 'three';

	import { PROCESS_EDGES, PROCESS_NODES, RETRY_EDGE } from '../data/process.js';
	import { SCENE_TEXT } from '../sceneText.js';
	import { PROCESS_PLACEMENT, SKY_ANCHOR, lookDir, skyPoint } from '../story.js';
	import { bow, buildFlowLines, buildGlowPoints } from '../gl/geometry.js';
	import { createFlowLineMaterial, createGlowPointMaterial } from '../gl/materials.js';

	/** @type {import('../runtime.js').Runtime} */
	export let runtime;

	const DISTANCE = 46;
	const nodeMaterial = createGlowPointMaterial(runtime.uniforms);
	const lineMaterial = createFlowLineMaterial(runtime.uniforms);
	const nodes = new Points(new BufferGeometry(), nodeMaterial);
	const lines = new Mesh(new BufferGeometry(), lineMaterial);
	nodes.renderOrder = 6;
	lines.renderOrder = 5;

	const smoothstep = (a, b, x) => {
		const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
		return t * t * (3 - 2 * t);
	};

	/** reveal window of a node in "process phase" units */
	const windowOf = (node) => /** @type {[number, number]} */ ([-0.3 + node.t, -0.3 + node.t + 0.2]);
	const byId = new Map(PROCESS_NODES.map((node) => [node.id, node]));
	const text = (id) => ({ en: SCENE_TEXT.en.process[id], ru: SCENE_TEXT.ru.process[id] });

	const labels = PROCESS_NODES.map((node) => ({
		node,
		state: runtime.addLabel({
			key: `process:${node.id}`,
			kind: node.kind === 'stage' ? 'stage' : 'agent',
			text: { en: text(node.id).en[0], ru: text(node.id).ru[0] }
		})
	}));
	const retryLabel = runtime.addLabel({
		key: 'process:retry',
		kind: 'note',
		text: { en: text('retry').en[0], ru: text('retry').ru[0] }
	});

	const positions = PROCESS_NODES.map(() => new Vector3());
	const hoverables = PROCESS_NODES.map((node, index) => ({
		key: `process:${node.id}`,
		title: { en: text(node.id).en[0], ru: text(node.id).ru[0] },
		text: { en: text(node.id).en[1], ru: text(node.id).ru[1] },
		world: positions[index],
		weight: () => smoothstep(...windowOf(node), runtime.phases.process),
		setHover: (on) => {
			nodeMaterial.uniforms.uHover.value = on ? index : -1;
		}
	}));
	hoverables.forEach((item) => runtime.hoverables.add(item));

	let retryWindow = /** @type {[number, number]} */ ([0, 1]);

	/** @param {'wide' | 'tall'} layout */
	const build = (layout) => {
		const place = PROCESS_PLACEMENT[layout];
		const anchor = SKY_ANCHOR[layout];
		const tall = place.orientation === 'tall';
		const facing = lookDir(place.yaw, place.pitch).negate();

		PROCESS_NODES.forEach((node, i) => {
			const [x, y] = tall ? node.tall : node.wide;
			skyPoint(
				anchor,
				place.yaw,
				place.pitch,
				DISTANCE,
				place.width,
				place.height,
				x,
				y,
				positions[i]
			);
		});

		const glow = PROCESS_NODES.map((node, i) => ({
			position: positions[i].toArray(),
			size: node.kind === 'stage' ? 4.4 + 1.6 * node.mag : 3.4,
			window: windowOf(node),
			kind: node.kind === 'stage' ? 3 : 0,
			seed: i * 0.21
		}));

		const flow = PROCESS_EDGES.map((edge, index) => {
			const from = byId.get(edge.from);
			const to = byId.get(edge.to);
			const a = positions[PROCESS_NODES.indexOf(from)];
			const b = positions[PROCESS_NODES.indexOf(to)];
			const retry = index === RETRY_EDGE;
			const reveal = retry
				? /** @type {[number, number]} */ ([windowOf(from)[0] + 0.2, windowOf(from)[0] + 0.5])
				: /** @type {[number, number]} */ ([windowOf(from)[0] + 0.1, windowOf(to)[0] + 0.04]);
			if (retry) retryWindow = reveal;
			const points = bow(a, b, tall ? -edge.bend : edge.bend, facing, retry ? 40 : 24);
			if (retry) {
				// apex of the loop on wide screens; lower on tall ones, clear of the agents
				const at = ((points.length / 3 - 1) * (tall ? 0.26 : 0.5)) | 0;
				retryLabel.world.set(points[at * 3], points[at * 3 + 1], points[at * 3 + 2]);
			}
			return {
				points,
				reveal,
				speed: edge.speed,
				pulses: edge.pulses,
				seed: index * 0.173,
				width: retry ? 1 : 1.25,
				base: edge.base
			};
		});

		const oldNodes = nodes.geometry;
		const oldLines = lines.geometry;
		nodes.geometry = buildGlowPoints(glow);
		lines.geometry = buildFlowLines(flow);
		oldNodes.dispose();
		oldLines.dispose();
		labels.forEach(({ state }, i) => state.world.copy(positions[i]));
	};

	let layout = runtime.layout;
	build(layout);

	/** @param {import('../runtime.js').Runtime} rt */
	const update = (rt) => {
		if (rt.layout !== layout) {
			layout = rt.layout;
			build(layout);
		}
		const phase = rt.phases.process;
		nodeMaterial.uniforms.uPhase.value = phase;
		lineMaterial.uniforms.uPhase.value = phase;
		const focus = 1 - smoothstep(3.0, 3.4, rt.T);
		nodeMaterial.uniforms.uFade.value = 0.3 + 0.7 * focus;
		lineMaterial.uniforms.uFade.value = 0.3 + 0.7 * focus;
		for (const { node, state } of labels) {
			const [a, b] = windowOf(node);
			state.opacity =
				smoothstep(a + 0.05, b + 0.05, phase) * (node.kind === 'stage' ? 1 : 0.8) * focus;
		}
		retryLabel.opacity =
			smoothstep(retryWindow[1] - 0.05, retryWindow[1] + 0.1, phase) * 0.7 * focus;
	};
	runtime.updaters.add(update);

	onDestroy(() => {
		runtime.updaters.delete(update);
		hoverables.forEach((item) => runtime.hoverables.delete(item));
		PROCESS_NODES.forEach((node) => runtime.removeLabel(`process:${node.id}`));
		runtime.removeLabel('process:retry');
	});
</script>

<T is={lines} />
<T is={nodes} />
