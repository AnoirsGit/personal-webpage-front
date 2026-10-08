/*
 * Scene colours, taken from the site palette (tailwind.config.js) so the canvas and the
 * page read as one surface. One accent carries every meaningful glow — places, data arcs,
 * constellation stars and lines, the process graph — and everything else stays cool and
 * quiet so the accent is the only thing that shines.
 *
 * Light module (no three.js): the page may import it to match the accent in CSS.
 */
export const SCENE_PALETTE = {
	/** canvas clear colour, a shade under the body background rgb(10, 5, 22) */
	space: '#07051a',
	/** accent-gold — the one glow colour */
	accent: '#e8c77e',
	/** white-hot centre of the accent (star cores, pulse heads) */
	accentHot: '#fff3d6',
	/** land dots, shadow and lit side */
	ink: '#4a4880',
	inkLit: '#a8a4e4',
	/** ocean body and its rim light */
	ocean: '#08081c',
	rim: '#3a3896',
	/** atmosphere halo */
	atmosphere: '#4c58c2',
	/** faint nebulae in the sky: main-purple and a deep blue */
	nebulaA: '#3b1478',
	nebulaB: '#0e2a63',
	/** distant stars */
	star: '#dfe3ff',
	starWarm: '#ffe9c4'
};
