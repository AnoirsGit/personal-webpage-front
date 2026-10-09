/*
 * Readable content over the scene.
 *
 * The page marks what must stay readable with `data-scene-occlude`: cards, panels, text
 * blocks, the header. For the scene those elements are "in front" — a card or button with
 * its whole box, a bare text block with the tight box of its lines and painted children:
 *   - its bright parts dim behind them (a small mask texture, see mask below and
 *     uOcclusion in gl/materials.js), so text never sits on a bright patch of the Earth,
 *   - its captions hide under them, and its stars never answer the pointer there.
 * `data-scene-keepout` marks text the whole-Earth shots frame around (the hero headline
 * and lead): `keepout` is the right edge (wide screens) and bottom (phones) of its lines.
 *
 * Rects are read from the DOM only when the layout may have changed (a resize, a change of
 * the page height, fonts, the end of a scroll) and kept in page coordinates, so a scrolling
 * frame costs no layout reads: it only subtracts window.scrollY.
 *
 * Light module (no three.js).
 */

/** Margin around every occluder, CSS px: the dim reaches a little past the text. */
const MARGIN = 10;
/** The mask's falloff, CSS px: rings drawn outside each rect at decreasing strength. */
const FEATHER = 18;
/** Mask resolution (texels). Fixed, so the texture is never reallocated on resize. */
export const MASK_SIZE = 128;

/**
 * @typedef {{ x: number, y: number, w: number, h: number, fixed: boolean }} Rect
 * @typedef {{ right: number, bottom: number }} Keepout
 */

/** Does the element paint a box of its own (background, border or shadow)? */
const paints = (element) => {
	const style = getComputedStyle(element);
	return (
		style.backgroundImage !== 'none' ||
		!/rgba\(0, 0, 0, 0\)|transparent/.test(style.backgroundColor) ||
		parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth) > 0 ||
		style.boxShadow !== 'none'
	);
};

/**
 * The part of an element that reads as content: its own box when it paints one (a card,
 * a button); otherwise the tight box around its text lines and painted children, so a
 * 760px-wide heading block with a short line does not claim the empty sky beside it.
 * @returns {{ left: number, top: number, right: number, bottom: number } | null}
 */
const contentBox = (element) => {
	const rect = element.getBoundingClientRect();
	if (rect.width <= 0 || rect.height <= 0) return null;
	if (paints(element)) return rect;
	let left = Infinity;
	let top = Infinity;
	let right = -Infinity;
	let bottom = -Infinity;
	const add = (box) => {
		if (box.width <= 0 || box.height <= 0) return;
		left = Math.min(left, box.left);
		top = Math.min(top, box.top);
		right = Math.max(right, box.right);
		bottom = Math.max(bottom, box.bottom);
	};
	const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
	const range = document.createRange();
	while (walker.nextNode()) {
		const node = /** @type {Text} */ (walker.currentNode);
		if (!node.data.trim()) continue;
		range.selectNodeContents(node);
		for (const box of range.getClientRects()) add(box);
	}
	for (const child of element.querySelectorAll('*')) if (paints(child)) add(child.getBoundingClientRect());
	return right > left ? { left, top, right, bottom } : null;
};

/** Right edge and bottom of the text lines inside an element. */
const textExtent = (element) => {
	let right = 0;
	let bottom = 0;
	const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
	const range = document.createRange();
	while (walker.nextNode()) {
		const node = /** @type {Text} */ (walker.currentNode);
		if (!node.data.trim()) continue;
		range.selectNodeContents(node);
		for (const rect of range.getClientRects()) {
			if (rect.width <= 0) continue;
			right = Math.max(right, rect.right);
			bottom = Math.max(bottom, rect.bottom);
		}
	}
	return { right, bottom };
};

export const createOcclusion = () => {
	const canvas = document.createElement('canvas');
	canvas.width = MASK_SIZE;
	canvas.height = MASK_SIZE;
	const context = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

	/** @type {Rect[]} */
	let rects = [];
	/** @type {Rect[]} rects in viewport coordinates for the current frame */
	let view = [];
	/** @type {Keepout | null} */
	let keepout = null;
	let version = 0;
	let drawn = '';

	const collect = () => {
		const scroll = window.scrollY;
		const next = [];
		for (const element of document.querySelectorAll('[data-scene-occlude]')) {
			const box = contentBox(element);
			if (!box) continue;
			const fixed = getComputedStyle(element).position === 'fixed';
			next.push({
				x: box.left - MARGIN,
				y: box.top + (fixed ? 0 : scroll) - MARGIN,
				w: box.right - box.left + 2 * MARGIN,
				h: box.bottom - box.top + 2 * MARGIN,
				fixed
			});
		}
		rects = next;

		let right = 0;
		let bottom = 0;
		for (const element of document.querySelectorAll('[data-scene-keepout]')) {
			const extent = textExtent(element);
			right = Math.max(right, extent.right);
			bottom = Math.max(bottom, extent.bottom + scroll);
		}
		keepout = right > 0 ? { right, bottom } : null;
		version++;
	};

	/**
	 * Moves the rects into the viewport for this frame and redraws the mask when anything
	 * changed. Returns true when the mask texture needs an upload.
	 * @param {number} width viewport, CSS px
	 * @param {number} height
	 */
	const update = (width, height) => {
		const scroll = window.scrollY;
		view = [];
		for (const rect of rects) {
			const y = rect.fixed ? rect.y : rect.y - scroll;
			if (y > height || y + rect.h < 0 || rect.x > width || rect.x + rect.w < 0) continue;
			view.push({ x: rect.x, y, w: rect.w, h: rect.h, fixed: rect.fixed });
		}
		const key = `${version}|${Math.round(scroll)}|${width}x${height}`;
		if (key === drawn) return false;
		drawn = key;

		context.setTransform(1, 0, 0, 1, 0, 0);
		context.globalCompositeOperation = 'source-over';
		context.fillStyle = '#000';
		context.fillRect(0, 0, MASK_SIZE, MASK_SIZE);
		context.setTransform(MASK_SIZE / Math.max(width, 1), 0, 0, MASK_SIZE / Math.max(height, 1), 0, 0);
		// additive rings: full strength inside, fading over FEATHER px outside
		context.globalCompositeOperation = 'lighter';
		context.fillStyle = 'rgba(255, 255, 255, 0.25)';
		for (let ring = 3; ring >= 0; ring--) {
			const grow = (ring * FEATHER) / 3;
			for (const rect of view) {
				context.fillRect(rect.x - grow, rect.y - grow, rect.w + 2 * grow, rect.h + 2 * grow);
			}
		}
		return true;
	};

	/** Is the viewport point (CSS px) under readable content? */
	const contains = (x, y) => {
		for (const rect of view) {
			if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) return true;
		}
		return false;
	};

	/** Does the viewport box overlap readable content? */
	const overlaps = (left, top, right, bottom) => {
		for (const rect of view) {
			if (left < rect.x + rect.w && right > rect.x && top < rect.y + rect.h && bottom > rect.y) {
				return true;
			}
		}
		return false;
	};

	return {
		canvas,
		collect,
		update,
		contains,
		overlaps,
		/** right edge / bottom of the keepout text in page coordinates, or null */
		get keepout() {
			return keepout;
		}
	};
};

/** @typedef {ReturnType<typeof createOcclusion>} Occlusion */
