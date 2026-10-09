<!--
	The scene's Earth: the old dot globe, upgraded. A dark planet body with a fresnel rim and
	an atmosphere shell, dot-matrix land whose dots lie flat on the sphere, the home country
	(from site-config.json) in denser warm dots with a faint border, a calm pulsing home
	marker, the public work places, and data arcs that leave home with pulses travelling
	both ways. Rests facing home; the story only nudges the spin and lean.

	Neutral mode (quality.neutral, the poster capture `?scene=poster`): no home country, no
	marker, no places or arcs, and the Earth faces POSTER_VIEW instead of home, so the
	poster stays true whatever the home is. The shell draws the home marker over the poster
	as HTML from the projection this mode publishes on window.__scenePoster.
-->
<script>
	import { onDestroy } from 'svelte';
	import { T } from '@threlte/core';
	import { Group, Matrix4, Mesh, Points, SphereGeometry, Vector3 } from 'three';

	import { BORDER_QUANT, COUNTRIES } from './countryBorders.js';
	import { decodeRings, latLonToXYZ, resolveCountry } from './geodata.js';
	import { arcPoints, borderLines, buildLandDots } from './landDots.js';

	import { HOME, HOME_PLACE, PLACES } from '$lib/scene/data/places.js';
	import { SCENE_TEXT, utcOffsetLabel } from '$lib/scene/sceneText.js';
	import { buildFlowLines, buildGlowPoints } from '$lib/scene/gl/geometry.js';
	import {
		createAtmosphereMaterial,
		createFlowLineMaterial,
		createGlowPointMaterial,
		createLandMaterial,
		createOceanMaterial
	} from '$lib/scene/gl/materials.js';

	/** @type {import('$lib/scene/runtime.js').Runtime} */
	export let runtime;

	const RADIUS = 5;
	const ATMOSPHERE = 1.17;
	const DEG = Math.PI / 180;
	const high = runtime.quality.tier === 'high';
	const neutral = Boolean(runtime.quality.neutral);
	/** where the neutral Earth looks: the Old World, centred between Europe, Africa and Asia */
	const POSTER_VIEW = { lat: 28, lon: 58 };
	const facingPoint = neutral ? POSTER_VIEW : HOME;

	/* light from the upper left, a little in front: the terminator falls on the right */
	const lightDir = new Vector3(-0.62, 0.48, 0.62).normalize();

	const country = neutral ? null : resolveCountry(COUNTRIES, HOME.iso3);
	const home = country
		? { bbox: country.bbox, rings: decodeRings(country.rings, BORDER_QUANT) }
		: null;

	/* ---- scene graph: earth (lean) > spin (rotation about the axis) > surface ---- */
	const earth = new Group();
	const spin = new Group();
	earth.add(spin);

	const ocean = new Mesh(
		new SphereGeometry(RADIUS, high ? 72 : 48, high ? 48 : 32),
		createOceanMaterial(runtime.uniforms, lightDir)
	);
	earth.add(ocean);

	const atmosphere = new Mesh(
		new SphereGeometry(RADIUS * ATMOSPHERE, high ? 72 : 48, high ? 48 : 32),
		createAtmosphereMaterial(runtime.uniforms, lightDir, ATMOSPHERE)
	);
	atmosphere.renderOrder = 1;
	earth.add(atmosphere);

	const spacing = high ? 0.85 : 1.25;
	const homeLocal = new Vector3(...latLonToXYZ(facingPoint.lat, facingPoint.lon, 1));
	const landMaterial = createLandMaterial(runtime.uniforms, lightDir, homeLocal);
	landMaterial.uniforms.uDotSize.value = RADIUS * spacing * DEG * 0.56;
	// without the border line (low tier) the home dots carry the emphasis alone
	landMaterial.uniforms.uHomeBoost.value = neutral ? 0 : high ? 0.4 : 0.6;
	const land = new Points(buildLandDots({ spacing, radius: RADIUS * 1.002, home }), landMaterial);
	land.renderOrder = 2;
	spin.add(land);

	/* ---- arcs from home (both directions) and the home border (high tier only) ---- */
	const lines = [];
	(neutral ? [] : PLACES).forEach((place, k) => {
		const points = arcPoints(HOME, place, RADIUS);
		const reveal = /** @type {[number, number]} */ ([0.42 + 0.12 * k, 0.86 + 0.08 * k]);
		lines.push(
			{ points, reveal, speed: 0.09 + 0.025 * k, pulses: 2, seed: 0.37 * k, width: 1.5, base: 0.3 },
			{
				points,
				reveal,
				speed: -(0.06 + 0.02 * k),
				pulses: 1,
				seed: 0.61 + 0.23 * k,
				width: 1.5,
				base: 0
			}
		);
	});
	if (home && high) {
		for (const points of borderLines(home.rings, RADIUS * 1.004)) {
			lines.push({ points, reveal: [0.3, 0.95], width: 1.1, base: 0.42 });
		}
	}
	const linesMaterial = createFlowLineMaterial(runtime.uniforms);
	const arcs = new Mesh(buildFlowLines(lines), linesMaterial);
	arcs.renderOrder = 3;
	spin.add(arcs);

	/* ---- home marker and places ---- */
	const markers = neutral
		? []
		: [
				{ id: 'home', lat: HOME.lat, lon: HOME.lon, size: 6.5, kind: 2 },
				...PLACES.map((place) => ({ ...place, size: 4.2, kind: 1 }))
		  ];
	const markerLocal = markers.map(
		({ lat, lon }) => new Vector3(...latLonToXYZ(lat, lon, RADIUS * 1.01))
	);
	const markerMaterial = createGlowPointMaterial(runtime.uniforms, { onSphere: true });
	const markerPoints = new Points(
		buildGlowPoints(
			markers.map((marker, i) => ({
				position: markerLocal[i].toArray(),
				size: marker.size,
				window: i === 0 ? [0.05, 0.45] : [0.55 + 0.12 * i, 0.8 + 0.12 * i],
				kind: marker.kind,
				seed: i * 0.29
			}))
		),
		markerMaterial
	);
	markerPoints.renderOrder = 4;
	spin.add(markerPoints);

	/* ---- labels and hover ---- */
	const offset = utcOffsetLabel(HOME.timezone);
	const homeTitle = {
		en: [HOME.city.en, HOME.countryName.en].filter(Boolean).join(' · '),
		ru: [HOME.city.ru ?? HOME.city.en, HOME.countryName.ru ?? HOME.countryName.en]
			.filter(Boolean)
			.join(' · ')
	};
	const homeText = {
		en: [SCENE_TEXT.en.home, offset, HOME_PLACE && SCENE_TEXT.en.places[HOME_PLACE.id]?.[1]]
			.filter(Boolean)
			.join(' · '),
		ru: [SCENE_TEXT.ru.home, offset, HOME_PLACE && SCENE_TEXT.ru.places[HOME_PLACE.id]?.[1]]
			.filter(Boolean)
			.join(' · ')
	};
	const homeLabel = neutral
		? null
		: runtime.addLabel({ key: 'globe:home', kind: 'home', text: homeTitle });

	const world = markerLocal.map(() => new Vector3());
	const facing = new Float32Array(markers.length);
	const reveal = (window, value) =>
		Math.min(1, Math.max(0, (value - window[0]) / (window[1] - window[0])));

	const hoverables = markers.map((marker, i) => ({
		key: `globe:${marker.id}`,
		title:
			i === 0
				? homeTitle
				: { en: SCENE_TEXT.en.places[marker.id][0], ru: SCENE_TEXT.ru.places[marker.id][0] },
		text:
			i === 0
				? homeText
				: { en: SCENE_TEXT.en.places[marker.id][1], ru: SCENE_TEXT.ru.places[marker.id][1] },
		world: world[i],
		weight: () => facing[i] * reveal(i === 0 ? [0.05, 0.45] : [0.55, 0.9], runtime.phases.intro),
		setHover: (on) => {
			markerMaterial.uniforms.uHover.value = on ? i : -1;
		}
	}));
	hoverables.forEach((item) => runtime.hoverables.add(item));

	const toCamera = new Vector3();
	const normal = new Vector3();
	const easeOut = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
	const smoothstep = (a, b, x) => {
		const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
		return t * t * (3 - 2 * t);
	};

	/** @param {import('$lib/scene/runtime.js').Runtime} rt */
	const update = (rt) => {
		const { shot, phases } = rt;
		const intro = phases.intro;
		const drift = rt.motion ? Math.sin(rt.uniforms.uTime.value * 0.07) * 5 : 0;
		earth.rotation.x = (facingPoint.lat * shot.tilt - shot.lean) * DEG;
		spin.rotation.y = (-facingPoint.lon + shot.spin + drift - 26 * (1 - easeOut(intro))) * DEG;

		const dim = shot.dim * shot.earthFade;
		ocean.material.uniforms.uDim.value = dim;
		atmosphere.material.uniforms.uDim.value = 0.6 + 0.4 * dim;
		landMaterial.uniforms.uDim.value = dim;
		linesMaterial.uniforms.uDim.value = dim;
		markerMaterial.uniforms.uDim.value = 0.5 + 0.5 * dim;
		linesMaterial.uniforms.uPhase.value = intro;
		markerMaterial.uniforms.uPhase.value = intro;

		earth.updateMatrixWorld();
		const camera = rt.camera;
		for (let i = 0; i < markers.length; i++) {
			world[i].copy(markerLocal[i]).applyMatrix4(spin.matrixWorld);
			toCamera.copy(camera.position).sub(world[i]).normalize();
			normal.copy(world[i]).normalize();
			facing[i] = Math.min(1, Math.max(0, (normal.dot(toCamera) - 0.12) / 0.25));
		}

		if (neutral) {
			publishPoster(camera);
			return;
		}
		// home caption: in the hero and contact shots, when home faces the camera
		const T = rt.T;
		const onEarth = Math.max(1 - smoothstep(0.72, 0.95, T), smoothstep(4.8, 5.1, T));
		if (homeLabel) {
			homeLabel.world.copy(world[0]);
			homeLabel.opacity = onEarth * facing[0] * reveal([0.35, 0.7], intro);
		}
	};

	/*
	 * Poster capture: the matrix from the Earth's own coordinates (latLonToXYZ) to clip space
	 * and the camera in those coordinates, so the shell can place the home marker over the
	 * still image and tell whether home faces the viewer (scripts/scene-poster.js saves it).
	 */
	const toClip = new Matrix4();
	const eye = new Vector3();
	/** @param {import('three').PerspectiveCamera} camera */
	const publishPoster = (camera) => {
		toClip.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(spin.matrixWorld);
		eye.copy(camera.position).applyMatrix4(new Matrix4().copy(spin.matrixWorld).invert());
		// @ts-ignore — read by scripts/scene-poster.js
		window.__scenePoster = {
			m: toClip.elements.map((value) => +value.toFixed(6)),
			eye: eye.toArray().map((value) => +value.toFixed(4)),
			r: RADIUS
		};
	};
	runtime.updaters.add(update);

	onDestroy(() => {
		runtime.updaters.delete(update);
		hoverables.forEach((item) => runtime.hoverables.delete(item));
		if (homeLabel) runtime.removeLabel('globe:home');
	});
</script>

<T is={earth} />
