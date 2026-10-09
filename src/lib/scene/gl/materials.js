/*
 * Materials of the scene. All are small ShaderMaterials that take colours as plain vec3
 * uniforms and include no tone-mapping or colour-space chunks, so the hex values in
 * palette.js are exactly what the page shows.
 *
 * Shared uniforms (time, pixel ratio, viewport, projection scale, motion, intro, the
 * content mask) are the same objects in every material, updated once per frame. The bright
 * materials (land, ocean rim, atmosphere, glow points, lines) dim behind readable page
 * content through contentShade() from occlusion.glsl.
 */
import {
	AdditiveBlending,
	BackSide,
	NormalBlending,
	ShaderMaterial,
	Vector2,
	Vector3
} from 'three';

import skyVert from '$lib/shared/shaders/scene/sky.vert?raw';
import skyFrag from '$lib/shared/shaders/scene/sky.frag?raw';
import nebulaVert from '$lib/shared/shaders/scene/nebula.vert?raw';
import nebulaFrag from '$lib/shared/shaders/scene/nebula.frag?raw';
import starsVert from '$lib/shared/shaders/scene/stars.vert?raw';
import starsFrag from '$lib/shared/shaders/scene/stars.frag?raw';
import earthVert from '$lib/shared/shaders/scene/earth.vert?raw';
import oceanFrag from '$lib/shared/shaders/scene/ocean.frag?raw';
import atmosphereFrag from '$lib/shared/shaders/scene/atmosphere.frag?raw';
import landVert from '$lib/shared/shaders/scene/land.vert?raw';
import landFrag from '$lib/shared/shaders/scene/land.frag?raw';
import flowLineVert from '$lib/shared/shaders/scene/flowLine.vert?raw';
import flowLineFrag from '$lib/shared/shaders/scene/flowLine.frag?raw';
import glowPointVert from '$lib/shared/shaders/scene/glowPoint.vert?raw';
import glowPointFrag from '$lib/shared/shaders/scene/glowPoint.frag?raw';
import meteorVert from '$lib/shared/shaders/scene/meteor.vert?raw';
import meteorFrag from '$lib/shared/shaders/scene/meteor.frag?raw';
import occlusionGlsl from '$lib/shared/shaders/scene/occlusion.glsl?raw';

import { SCENE_PALETTE } from '../palette.js';

/** '#rrggbb' → linear-free RGB triple in 0..1 (no colour management on purpose). */
export const rgb = (hex) => {
	const n = parseInt(hex.slice(1), 16);
	return new Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

export const createSharedUniforms = () => ({
	uTime: { value: 0 },
	uPixelRatio: { value: 1 },
	uViewport: { value: new Vector2(1, 1) },
	/** drawing-buffer pixels per world unit at distance 1 */
	uProjScale: { value: 1 },
	/** 1 normally, 0 with prefers-reduced-motion */
	uMotion: { value: 1 },
	/** 0 → 1 while the scene appears */
	uIntro: { value: 0 },
	uMaxPoint: { value: 64 },
	/** mask of the page content in front of the scene (occlusion.js), 1 = content */
	uOcclusion: { value: /** @type {import('three').Texture | null} */ (null) },
	/** how much the bright materials dim behind content */
	uOccludeDim: { value: 0.8 }
});

/** Prepends the content mask to a fragment shader. */
const shaded = (fragment) => `${occlusionGlsl}\n${fragment}`;

/** @typedef {ReturnType<typeof createSharedUniforms>} SharedUniforms */

const base = (shared, extra) => ({ ...shared, ...extra });

/** @param {SharedUniforms} shared */
export const createSkyMaterial = (shared) =>
	new ShaderMaterial({
		vertexShader: skyVert,
		fragmentShader: shaded(skyFrag),
		uniforms: base(shared, {
			uBase: { value: rgb(SCENE_PALETTE.space) },
			uBandNormal: { value: new Vector3(0.38, 0.62, 0.68).normalize() },
			uDim: { value: 1 },
			/** the baked nebula map (parts/Sky.svelte), and 0 → 1 once it is there */
			uNebula: { value: /** @type {import('three').Texture | null} */ (null) },
			uNebulaMix: { value: 0 },
			uViolet: { value: rgb(SCENE_PALETTE.nebulaViolet) },
			uIndigo: { value: rgb(SCENE_PALETTE.nebulaIndigo) },
			uWarm: { value: rgb(SCENE_PALETTE.nebulaWarm) },
			uCamera: { value: new Vector3() }
		}),
		// the camera is inside the dome: its faces point away from it
		side: BackSide,
		depthTest: false,
		depthWrite: false
	});

/**
 * The one-off bake of the nebula densities (nebula.frag) into an equirectangular map. The
 * centres of the clouds are directions as seen from the scene's origin, chosen from the
 * camera's shots in story.js (yaw, pitch): they fill the skies of the skills, process and
 * low-orbit sections in both layouts; the hero's text column gets only the faint veil.
 */
export const createNebulaBakeMaterial = () => {
	const towards = (yaw, pitch) => {
		const y = (yaw * Math.PI) / 180;
		const p = (pitch * Math.PI) / 180;
		return new Vector3(Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p));
	};
	return new ShaderMaterial({
		vertexShader: nebulaVert,
		fragmentShader: nebulaFrag,
		uniforms: {
			uCloudA: { value: towards(-14, 40) },
			uCloudB: { value: towards(40, 22) },
			uCloudC: { value: towards(22, -6) },
			uCloudD: { value: towards(-6, -4) },
			uCloudE: { value: towards(8, 68) }
		},
		depthTest: false,
		depthWrite: false
	});
};

/** @param {SharedUniforms} shared */
export const createStarsMaterial = (shared) =>
	new ShaderMaterial({
		vertexShader: starsVert,
		fragmentShader: starsFrag,
		/* uBoost: the whole field a quarter brighter than the first version of the sky */
		uniforms: base(shared, { uDim: { value: 1 }, uBoost: { value: 1.25 } }),
		transparent: true,
		depthWrite: false,
		blending: AdditiveBlending
	});

/** @param {SharedUniforms} shared */
export const createOceanMaterial = (shared, lightDir) =>
	new ShaderMaterial({
		vertexShader: earthVert,
		fragmentShader: shaded(oceanFrag),
		uniforms: base(shared, {
			uOcean: { value: rgb(SCENE_PALETTE.ocean) },
			uRim: { value: rgb(SCENE_PALETTE.rim) },
			uLightDir: { value: lightDir },
			uDim: { value: 1 }
		})
	});

/**
 * @param {SharedUniforms} shared
 * @param {Vector3} lightDir
 * @param {number} ratio atmosphere radius / planet radius
 */
export const createAtmosphereMaterial = (shared, lightDir, ratio) =>
	new ShaderMaterial({
		vertexShader: earthVert,
		fragmentShader: shaded(atmosphereFrag),
		uniforms: base(shared, {
			uColor: { value: rgb(SCENE_PALETTE.atmosphere) },
			uLightDir: { value: lightDir },
			uLimb: { value: Math.sqrt(1 - 1 / (ratio * ratio)) },
			uStrength: { value: 0.85 },
			uDim: { value: 1 }
		}),
		side: BackSide,
		transparent: true,
		depthWrite: false,
		blending: AdditiveBlending
	});

/** @param {SharedUniforms} shared */
export const createLandMaterial = (shared, lightDir, home) =>
	new ShaderMaterial({
		vertexShader: landVert,
		fragmentShader: shaded(landFrag),
		uniforms: base(shared, {
			uDotSize: { value: 0.05 },
			/** how far home-country dots lean to the accent */
			uHomeBoost: { value: 0.4 },
			uHome: { value: home },
			uLightDir: { value: lightDir },
			uInk: { value: rgb(SCENE_PALETTE.ink) },
			uInkLit: { value: rgb(SCENE_PALETTE.inkLit) },
			uAccent: { value: rgb(SCENE_PALETTE.accent) },
			uDim: { value: 1 }
		}),
		transparent: true,
		depthWrite: false,
		blending: NormalBlending
	});

/** @param {SharedUniforms} shared */
export const createFlowLineMaterial = (shared) =>
	new ShaderMaterial({
		vertexShader: flowLineVert,
		fragmentShader: shaded(flowLineFrag),
		uniforms: base(shared, {
			uPhase: { value: 0 },
			uColor: { value: rgb(SCENE_PALETTE.accent) },
			uHot: { value: rgb(SCENE_PALETTE.accentHot) },
			uFade: { value: 1 },
			uDim: { value: 1 }
		}),
		transparent: true,
		depthWrite: false,
		blending: AdditiveBlending
	});

/**
 * @param {SharedUniforms} shared
 * @param {{ onSphere?: boolean }} [options]
 */
export const createGlowPointMaterial = (shared, { onSphere = false } = {}) =>
	new ShaderMaterial({
		vertexShader: glowPointVert,
		fragmentShader: shaded(glowPointFrag),
		uniforms: base(shared, {
			uPhase: { value: 0 },
			uHover: { value: -1 },
			uOnSphere: { value: onSphere ? 1 : 0 },
			uColor: { value: rgb(SCENE_PALETTE.accent) },
			uHot: { value: rgb(SCENE_PALETTE.accentHot) },
			uFade: { value: 1 },
			uDim: { value: 1 }
		}),
		transparent: true,
		depthWrite: false,
		blending: AdditiveBlending
	});

/** @param {SharedUniforms} shared */
export const createMeteorMaterial = (shared) =>
	new ShaderMaterial({
		vertexShader: meteorVert,
		fragmentShader: shaded(meteorFrag),
		uniforms: base(shared, {
			uColor: { value: rgb(SCENE_PALETTE.starWarm) },
			uHot: { value: rgb(SCENE_PALETTE.accentHot) },
			uFade: { value: 0 }
		}),
		transparent: true,
		depthWrite: false,
		blending: AdditiveBlending
	});
