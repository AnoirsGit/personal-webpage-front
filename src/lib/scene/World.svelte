<!--
	The scene graph and its single frame loop.

	- Story time follows sceneStore through a critically damped spring, so scrolling, jumps
	  and anchor links all become calm camera moves.
	- Parts mount in stages (sky → stars → Earth → constellations → process), each compiled
	  with compileAsync before the next, so no frame has to compile every shader at once.
	- Frames are capped near 60 fps on high-refresh screens, rendered on demand only with
	  prefers-reduced-motion, and the loop stops while the tab is hidden.
	- If frames stay slow, the pixel ratio steps down; if even that fails, `fail` asks the
	  shell to swap in the poster.
	- Page content marked data-scene-occlude stays in front (./occlusion.js): the bright
	  parts dim behind it, captions hide under it and stars there ignore the pointer.
-->
<script>
	import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
	import { T, useTask, useThrelte } from '@threlte/core';
	import { PerspectiveCamera, Vector3 } from 'three';

	import { SCENE_SECTIONS, sceneStore, storyTime } from './sceneStore.js';
	import { evaluateStory, layoutFor, phases } from './story.js';
	import Sky from './parts/Sky.svelte';
	import Starfield from './parts/Starfield.svelte';
	import Constellations from './parts/Constellations.svelte';
	import ProcessGraph from './parts/ProcessGraph.svelte';
	import OrbitGlobe from '$lib/entities/globe/OrbitGlobe.svelte';

	/** @type {import('./runtime.js').Runtime} */
	export let runtime;

	const dispatch = createEventDispatcher();
	const { renderer, scene, size, advance, renderMode, dpr } = useThrelte();
	renderMode.set('manual');

	const DEG = Math.PI / 180;
	const FRAME_MS = 12.5; // cap ≈ 80 fps: every frame at 60/75 Hz, every other at 120/144 Hz
	const FROZEN_TIME = 8.2; // reduced motion: the moment the still frames show
	const camera = new PerspectiveCamera(40, 1, 0.1, 1600);
	runtime.camera = camera;

	let stage = 0;
	let destroyed = false;
	let needsRender = true;
	runtime.requestRender = () => {
		needsRender = true;
	};

	/* ---------------- inputs: story, size, pointer ---------------- */
	let target = 0;
	let section = 0;
	const unsubscribeStore = sceneStore.subscribe((state) => {
		target = storyTime(state);
		runtime.skillsList = state.skillsView === 'list';
		const index = Math.max(0, SCENE_SECTIONS.indexOf(state.section));
		if (index !== section && !runtime.motion) runtime.onCut?.();
		section = index;
		needsRender = true;
	});

	let width = 1;
	let height = 1;
	let layoutDirty = true;
	const unsubscribeSize = size.subscribe((next) => {
		width = Math.max(1, next.width);
		height = Math.max(1, next.height);
		layoutDirty = true;
		needsRender = true;
	});

	const occlusion = runtime.occlusion;
	const pointer = { x: 0, y: 0, active: false, overUi: false, touch: false, until: 0 };
	const parallax = { x: 0, y: 0 };
	const INTERACTIVE =
		'a, button, input, textarea, select, label, summary, [role="button"], [data-scene-occlude]';

	/** @param {PointerEvent} event */
	const onPointerMove = (event) => {
		if (event.pointerType === 'touch') return;
		pointer.x = event.clientX;
		pointer.y = event.clientY;
		pointer.active = true;
		pointer.touch = false;
		const element = /** @type {Element | null} */ (event.target);
		pointer.overUi = Boolean(element?.closest?.(INTERACTIVE));
		needsRender = true;
	};
	const onPointerLeave = () => {
		pointer.active = false;
		needsRender = true;
	};
	let tapStart = { x: 0, y: 0, time: 0 };
	/** @param {PointerEvent} event */
	const onPointerDown = (event) => {
		if (event.pointerType !== 'touch') return;
		tapStart = { x: event.clientX, y: event.clientY, time: performance.now() };
	};
	/** @param {PointerEvent} event — a tap (not a scroll) on empty space picks a star */
	const onPointerUp = (event) => {
		if (event.pointerType !== 'touch') return;
		const moved = Math.hypot(event.clientX - tapStart.x, event.clientY - tapStart.y);
		if (moved > 10 || performance.now() - tapStart.time > 450) return;
		const element = /** @type {Element | null} */ (event.target);
		if (element?.closest?.(INTERACTIVE) || occlusion.contains(event.clientX, event.clientY)) return;
		pointer.x = event.clientX;
		pointer.y = event.clientY;
		pointer.active = true;
		pointer.touch = true;
		pointer.overUi = false;
		pointer.until = performance.now() + 3500;
		needsRender = true;
	};

	/* ---------------- staged mount ---------------- */
	const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
	const idle = (timeout) =>
		new Promise((resolve) =>
			'requestIdleCallback' in window
				? window.requestIdleCallback(() => resolve(undefined), { timeout })
				: setTimeout(resolve, 50)
		);

	/* content rects: re-read when the layout may have changed, never per scroll frame */
	let collectFrame = 0;
	/** @type {number[]} */
	let settleTimers = [];
	const collect = () => {
		collectFrame = 0;
		occlusion.collect();
		layoutDirty = true;
		needsRender = true;
	};
	const scheduleCollect = () => {
		if (!collectFrame) collectFrame = requestAnimationFrame(collect);
	};
	// after a scroll stops (reveal animations may still be moving cards): read twice
	const onScroll = () => {
		needsRender = true;
		settleTimers.forEach(clearTimeout);
		settleTimers = [window.setTimeout(scheduleCollect, 180), window.setTimeout(scheduleCollect, 900)];
	};
	const bodyObserver =
		typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleCollect);

	onMount(() => {
		collect();
		bodyObserver?.observe(document.body);
		window.addEventListener('resize', scheduleCollect, { passive: true });
		window.addEventListener('scroll', onScroll, { passive: true });
		document.fonts?.ready.then(() => !destroyed && scheduleCollect());
		window.addEventListener('pointermove', onPointerMove, { passive: true });
		window.addEventListener('pointerdown', onPointerDown, { passive: true });
		window.addEventListener('pointerup', onPointerUp, { passive: true });
		document.documentElement.addEventListener('pointerleave', onPointerLeave);
		document.addEventListener('visibilitychange', onVisibility);
		renderer.domElement.addEventListener('webglcontextlost', onContextLost);

		(async () => {
			for (const next of [1, 2, 3, 4]) {
				if (destroyed) return;
				stage = next;
				await tick();
				try {
					await renderer.compileAsync(scene, camera);
				} catch {
					// compile errors surface on render; nothing to do here
				}
				needsRender = true;
				await nextFrame();
				await nextFrame();
				if (destroyed) return;
				if (next === 2) dispatch('ready');
				await idle(600);
			}
		})();
	});

	/* ---------------- frame loop ---------------- */
	let lastRender = 0;
	let time = 0;
	let introStart = -1;
	let storyT = 0;
	let storyV = 0;
	let started = false;
	let hovered = /** @type {any} */ (null);

	/** @type {import('./story.js').View} */
	const view = { width: 1, height: 1, keepout: null };
	const projected = new Vector3();
	const lookTarget = new Vector3();
	const right = new Vector3();
	const up = new Vector3();
	const uniforms = runtime.uniforms;

	const easeOut = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

	/* adaptive resolution */
	const perf = { sum: 0, count: 0, since: 0, strikes: 0 };
	const minDpr = runtime.quality.tier === 'high' ? 1 : 0.75;
	let currentDpr = runtime.quality.dpr;

	/* debug stats for QA (?scene=debug) */
	const debug =
		typeof window !== 'undefined' &&
		new URLSearchParams(window.location.search).get('scene') === 'debug';
	const stats = {
		frames: 0,
		intervals: /** @type {number[]} */ ([]),
		work: /** @type {number[]} */ ([]),
		gpu: /** @type {number[]} */ ([])
	};
	if (debug) {
		// @ts-ignore — QA hook
		window.__sceneStats = {
			stats,
			runtime,
			get dpr() {
				return currentDpr;
			}
		};
		// GPU time per rendered frame, where the browser exposes timer queries
		const gl = /** @type {WebGL2RenderingContext} */ (renderer.getContext());
		const timer = gl.getExtension('EXT_disjoint_timer_query_webgl2');
		if (timer && typeof gl.createQuery === 'function') {
			const pending = /** @type {WebGLQuery[]} */ ([]);
			const render = renderer.render.bind(renderer);
			renderer.render = (...args) => {
				for (let i = pending.length - 1; i >= 0; i--) {
					if (gl.getQueryParameter(pending[i], gl.QUERY_RESULT_AVAILABLE)) {
						if (!gl.getParameter(timer.GPU_DISJOINT_EXT)) {
							stats.gpu.push(gl.getQueryParameter(pending[i], gl.QUERY_RESULT) / 1e6);
						}
						gl.deleteQuery(pending[i]);
						pending.splice(i, 1);
					}
				}
				const query = gl.createQuery();
				if (pending.length > 8 || !query) return render(...args);
				gl.beginQuery(timer.TIME_ELAPSED_EXT, query);
				render(...args);
				gl.endQuery(timer.TIME_ELAPSED_EXT);
				pending.push(query);
			};
		}
	}

	const frame = () => {
		const now = performance.now();
		const motion = runtime.motion;
		if (motion) {
			if (now - lastRender < FRAME_MS) return;
		} else if (!needsRender) {
			return;
		}
		needsRender = false;
		const dt = lastRender ? Math.min(0.1, (now - lastRender) / 1000) : 1 / 60;
		if (debug && lastRender) stats.intervals.push(now - lastRender);
		lastRender = now;
		if (motion) time += dt;

		if (layoutDirty) {
			layoutDirty = false;
			runtime.layout = layoutFor(width, height);
			runtime.layoutStore.set(runtime.layout);
			camera.aspect = width / height;
			view.width = width;
			view.height = height;
			view.keepout = occlusion.keepout;
		}
		if (occlusion.update(width, height)) runtime.occlusionTexture.needsUpdate = true;

		/* story time: spring toward the store (snaps to the section's still with reduced motion) */
		if (!started) {
			storyT = target;
			started = true;
		}
		if (motion) {
			const omega = 6.5;
			storyV += (omega * omega * (target - storyT) - 2 * omega * storyV) * dt;
			storyV = Math.max(-2.5, Math.min(2.5, storyV));
			storyT += storyV * dt;
		} else {
			storyT = Math.floor(Math.min(5.999, Math.max(0, target))) + 0.5;
		}
		runtime.T = storyT;

		/* reveals */
		if (stage >= 2 && introStart < 0) introStart = now;
		runtime.phases.intro = motion
			? introStart < 0
				? 0
				: Math.min(1, (now - introStart) / 2800)
			: 1;
		if (motion) {
			const p = phases(storyT);
			runtime.phases.skills = p.skills;
			runtime.phases.process = p.process;
		} else {
			runtime.phases.skills = storyT >= 1 ? 2 : -2;
			runtime.phases.process = storyT >= 2 ? 2 : -2;
		}

		/* camera */
		const shot = evaluateStory(storyT, runtime.layout, runtime.shot, view);
		camera.position.copy(shot.pos);
		lookTarget.copy(shot.pos).add(shot.dir);
		camera.lookAt(lookTarget);
		if (motion) {
			// pointer parallax and a slow idle drift: the camera slides, the aim stays
			const px = pointer.active && !pointer.touch ? (pointer.x / width) * 2 - 1 : 0;
			const py = pointer.active && !pointer.touch ? (pointer.y / height) * 2 - 1 : 0;
			parallax.x += (px - parallax.x) * Math.min(1, dt * 2.5);
			parallax.y += (py - parallax.y) * Math.min(1, dt * 2.5);
			right.set(1, 0, 0).applyQuaternion(camera.quaternion);
			up.set(0, 1, 0).applyQuaternion(camera.quaternion);
			const dx = parallax.x * 0.22 + Math.sin(time * 0.11) * 0.1;
			const dy = -parallax.y * 0.14 + Math.sin(time * 0.083) * 0.07;
			camera.position.addScaledVector(right, dx).addScaledVector(up, dy);
			lookTarget.addScaledVector(right, dx).addScaledVector(up, dy);
			camera.lookAt(lookTarget);
		}
		camera.fov = shot.fov;
		camera.setViewOffset(
			width,
			height,
			(-shot.shiftX * width) / 2,
			(shot.shiftY * height) / 2,
			width,
			height
		);
		camera.updateMatrixWorld();

		/* shared uniforms */
		const pixelRatio = renderer.getPixelRatio();
		uniforms.uTime.value = motion ? time : FROZEN_TIME;
		uniforms.uPixelRatio.value = pixelRatio;
		uniforms.uViewport.value.set(width * pixelRatio, height * pixelRatio);
		uniforms.uProjScale.value = (height * pixelRatio) / (2 * Math.tan((shot.fov * DEG) / 2));
		uniforms.uMotion.value = motion ? 1 : 0;
		uniforms.uIntro.value = easeOut(runtime.phases.intro);
		uniforms.uMaxPoint.value = runtime.quality.maxPointSize;

		for (const update of runtime.updaters) update(runtime);
		pickHover(now);
		placeLabels(dt);

		advance();

		if (debug) stats.work.push(performance.now() - now);
		stats.frames++;
		if (motion) adapt(now, dt);
	};

	const pickHover = (now) => {
		if (pointer.touch && now > pointer.until) pointer.active = false;
		let best = null;
		let bestDistance = pointer.touch ? 34 : 22;
		// over page content nothing in the scene answers, even if the page scrolled under a
		// still pointer (no pointermove then)
		if (pointer.active && !pointer.overUi && !occlusion.contains(pointer.x, pointer.y)) {
			for (const item of runtime.hoverables) {
				if (item.weight() < 0.5) continue;
				projected.copy(item.world).project(camera);
				if (projected.z > 1) continue;
				const x = (projected.x * 0.5 + 0.5) * width;
				const y = (0.5 - projected.y * 0.5) * height;
				const distance = Math.hypot(x - pointer.x, y - pointer.y);
				if (distance < bestDistance) {
					bestDistance = distance;
					best = item;
				}
			}
		}
		if (best !== hovered) {
			hovered?.setHover(false);
			best?.setHover(true);
			hovered = best;
			runtime.hover.set(best);
		}

		const cardState = runtime.hoverCard;
		const el = cardState.el;
		if (!el) return;
		if (!hovered) {
			if (cardState.o !== 0) {
				el.style.opacity = '0';
				cardState.o = 0;
			}
			return;
		}
		projected.copy(hovered.world).project(camera);
		const x = (projected.x * 0.5 + 0.5) * width;
		const y = (0.5 - projected.y * 0.5) * height;
		const flipX = x > width * 0.62;
		const below = y < 140;
		el.style.transform =
			`translate3d(${(x + (flipX ? -18 : 18)).toFixed(1)}px, ${(y + (below ? 18 : -18)).toFixed(
				1
			)}px, 0)` + ` translate(${flipX ? '-100%' : '0'}, ${below ? '0' : '-100%'})`;
		if (cardState.o !== 1) {
			el.style.opacity = '1';
			cardState.o = 1;
		}
	};

	/* the caption's box around its anchor, from Labels.svelte's CSS for each kind */
	const BOX = {
		constellation: (w, h) => [-w / 2, -h / 2, w / 2, h / 2],
		stage: (w, h) => [-w / 2, 16, w / 2, 16 + h],
		agent: (w, h) => [-w / 2, -h - 9, w / 2, -9],
		note: (w, h) => [-w / 2, 9, w / 2, 9 + h],
		home: (w, h) => [14, -h / 2, 14 + w, h / 2]
	};

	const placeLabels = (dt) => {
		const step = runtime.motion ? Math.min(1, dt * 7) : 1;
		for (const state of runtime.labels.values()) {
			const el = state.el;
			if (!el) continue;
			let opacity = state.opacity;
			if (opacity > 0.01) {
				projected.copy(state.world).project(camera);
				if (projected.z > 1 || Math.abs(projected.x) > 1.15 || Math.abs(projected.y) > 1.15) {
					opacity = 0;
				} else {
					const x = (projected.x * 0.5 + 0.5) * width;
					const y = (0.5 - projected.y * 0.5) * height;
					if (Math.abs(x - state.x) > 0.3 || Math.abs(y - state.y) > 0.3) {
						el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
						state.x = x;
						state.y = y;
					}
					// a caption never sits under page content: it fades out there
					const box = (BOX[state.kind] ?? BOX.constellation)(state.w || 120, state.h || 14);
					const under = occlusion.overlaps(x + box[0], y + box[1], x + box[2], y + box[3]);
					state.shown += ((under ? 0 : 1) - state.shown) * step;
					opacity *= state.shown;
				}
			} else {
				opacity = 0;
			}
			opacity = Math.round(opacity * 50) / 50;
			if (opacity !== state.o) {
				el.style.opacity = String(opacity);
				state.o = opacity;
			}
		}
	};

	/** Steps the pixel ratio down while frames stay slow; asks for the poster as a last resort. */
	const adapt = (now, dt) => {
		if (introStart < 0 || now - introStart < 3000 || document.hidden) return;
		perf.sum += dt * 1000;
		perf.count++;
		if (!perf.since) perf.since = now;
		if (now - perf.since < 2000) return;
		const average = perf.sum / Math.max(1, perf.count);
		perf.sum = 0;
		perf.count = 0;
		perf.since = now;
		if (average < 24) {
			perf.strikes = 0;
			return;
		}
		perf.strikes++;
		if (perf.strikes < 2) return;
		perf.strikes = 0;
		if (currentDpr > minDpr + 0.01) {
			currentDpr = Math.max(minDpr, currentDpr - 0.25);
			dpr.set(currentDpr);
		} else if (average > 40) {
			dispatch('fail', { reason: 'slow' });
		}
	};

	const { start, stop } = useTask(frame, { autoInvalidate: false });

	const onVisibility = () => {
		if (document.hidden) {
			stop();
		} else {
			lastRender = 0;
			perf.sum = perf.count = perf.since = 0;
			needsRender = true;
			start();
		}
	};

	/** @param {Event} event */
	const onContextLost = (event) => {
		event.preventDefault();
		dispatch('fail', { reason: 'context-lost' });
	};

	onDestroy(() => {
		destroyed = true;
		stop();
		unsubscribeStore();
		unsubscribeSize();
		if (typeof window === 'undefined') return;
		cancelAnimationFrame(collectFrame);
		settleTimers.forEach(clearTimeout);
		bodyObserver?.disconnect();
		window.removeEventListener('resize', scheduleCollect);
		window.removeEventListener('scroll', onScroll);
		window.removeEventListener('pointermove', onPointerMove);
		window.removeEventListener('pointerdown', onPointerDown);
		window.removeEventListener('pointerup', onPointerUp);
		document.documentElement.removeEventListener('pointerleave', onPointerLeave);
		document.removeEventListener('visibilitychange', onVisibility);
		renderer.domElement?.removeEventListener('webglcontextlost', onContextLost);
	});
</script>

<T is={camera} makeDefault manual />

<Sky {runtime} />
{#if stage >= 1}
	<Starfield {runtime} />
{/if}
{#if stage >= 2}
	<OrbitGlobe {runtime} />
{/if}
{#if stage >= 3}
	<Constellations {runtime} />
{/if}
{#if stage >= 4}
	<ProcessGraph {runtime} />
{/if}
