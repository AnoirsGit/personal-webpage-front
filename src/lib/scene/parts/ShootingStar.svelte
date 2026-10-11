<!--
	Now and then a shooting star: a short streak across the sky the camera is looking at,
	at most one every 18–32 seconds and never in the first moments (`?scene=debug` sends the
	first one after 1.5 s, for screenshots). Never with reduced motion. It flies far behind the Earth (hidden where the planet is in front), and like
	every bright part it dims behind the page's text.
-->
<script>
	import { onDestroy } from 'svelte';
	import { T } from '@threlte/core';
	import { BufferAttribute, BufferGeometry, Mesh, Vector3 } from 'three';

	import { random } from '../gl/geometry.js';
	import { createMeteorMaterial } from '../gl/materials.js';

	/** @type {import('../runtime.js').Runtime} */
	export let runtime;

	const DISTANCE = 160;
	const FIRST_AFTER = 9000;
	const GAP = [18000, 32000];
	const DURATION = 950;
	/** width of the streak's glow at the head, CSS px (the bright core is about a third) */
	const WIDTH = 6;

	const material = createMeteorMaterial(runtime.uniforms);
	const positions = new Float32Array(12);
	const geometry = new BufferGeometry();
	geometry.setAttribute('position', new BufferAttribute(positions, 3));
	geometry.setAttribute('aAlong', new BufferAttribute(new Float32Array([0, 0, 1, 1]), 1));
	geometry.setAttribute('aSide', new BufferAttribute(new Float32Array([-1, 1, -1, 1]), 1));
	geometry.setIndex([0, 2, 1, 1, 2, 3]);
	const meteor = new Mesh(geometry, material);
	meteor.frustumCulled = false;
	meteor.renderOrder = -40;
	meteor.visible = false;

	const rand = random(Math.floor(Math.random() * 1e9));
	const start = new Vector3();
	const end = new Vector3();
	const head = new Vector3();
	const tail = new Vector3();
	const across = new Vector3();
	const view = new Vector3();
	const point = new Vector3();
	let flying = -1;
	// QA (?scene=debug): the first one comes right away, so a screenshot can catch it
	const debug = new URLSearchParams(window.location.search).get('scene') === 'debug';
	let next = performance.now() + (debug ? 1500 : FIRST_AFTER + rand() * 8000);

	/** a point on the sky under normalised screen coordinates, DISTANCE away from the camera */
	const onSky = (camera, x, y, out) => {
		point.set(x, y, 0.5).unproject(camera).sub(camera.position).normalize();
		return out.copy(camera.position).addScaledVector(point, DISTANCE);
	};

	const launch = (camera, now, wide) => {
		// start in the open upper sky (right of the text column on wide screens) and fall
		// diagonally across a fifth of the view
		const x = wide ? -0.15 + rand() * 0.9 : -0.6 + rand() * 1.2;
		const y = wide ? 0.2 + rand() * 0.6 : 0.3 + rand() * 0.55;
		const angle = (rand() < 0.5 ? -1 : 1) * (0.35 + rand() * 0.5);
		const length = 0.35 + rand() * 0.2;
		onSky(camera, x, y, start);
		onSky(camera, x + Math.sin(angle) * length, y - Math.cos(angle) * length * 0.8, end);
		flying = now;
	};

	/** @param {import('../runtime.js').Runtime} rt */
	const update = (rt) => {
		const camera = rt.camera;
		const now = performance.now();
		if (!rt.motion || !camera || document.hidden) {
			meteor.visible = false;
			flying = -1;
			return;
		}
		if (flying < 0) {
			if (now < next) return;
			launch(camera, now, rt.layout === 'wide');
		}
		const p = (now - flying) / DURATION;
		if (p >= 1) {
			meteor.visible = false;
			flying = -1;
			next = now + GAP[0] + rand() * (GAP[1] - GAP[0]);
			return;
		}
		const eased = 1 - Math.pow(1 - p, 2);
		head.lerpVectors(start, end, eased);
		tail.lerpVectors(start, end, Math.max(0, eased - 0.32 * Math.min(1, p * 2.5)));
		// a quad facing the camera, WIDTH px wide at the head and narrowing to the tail
		view.copy(head).sub(camera.position);
		const distance = view.length();
		across
			.copy(head)
			.sub(tail)
			.cross(view)
			.normalize()
			.multiplyScalar(
				(WIDTH / 2) * ((rt.uniforms.uPixelRatio.value * distance) / rt.uniforms.uProjScale.value)
			);
		positions.set([
			tail.x - across.x * 0.3,
			tail.y - across.y * 0.3,
			tail.z - across.z * 0.3,
			tail.x + across.x * 0.3,
			tail.y + across.y * 0.3,
			tail.z + across.z * 0.3,
			head.x - across.x,
			head.y - across.y,
			head.z - across.z,
			head.x + across.x,
			head.y + across.y,
			head.z + across.z
		]);
		geometry.attributes.position.needsUpdate = true;
		material.uniforms.uFade.value = Math.min(1, p / 0.12) * Math.min(1, (1 - p) / 0.35) * 0.85;
		meteor.visible = true;
		// @ts-ignore — QA: lets a screenshot script wait for the streak
		if (debug) window.__meteorAt = p;
	};
	runtime.updaters.add(update);

	onDestroy(() => {
		runtime.updaters.delete(update);
		geometry.dispose();
		material.dispose();
	});
</script>

<T is={meteor} />
