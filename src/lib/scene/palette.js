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
	/**
	 * The Milky Way, added on top of the sky where the baked band is dense (galaxy.frag): its
	 * diffuse light a cool lavender, the core a warm cream from the accent, the gas knots a
	 * muted rose. All low, so text over the band keeps its contrast.
	 */
	galaxyGlow: '#34365a',
	galaxyCore: '#5a472c',
	galaxyRose: '#3c2040',
	/** distant stars */
	star: '#dfe3ff',
	starWarm: '#ffe9c4'
};
