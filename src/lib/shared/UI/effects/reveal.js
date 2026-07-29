/*
 * Svelte action: fades + slides an element in when it enters the viewport.
 * Styling lives in app.css (.reveal-hidden / .reveal-shown).
 * Honors prefers-reduced-motion by not animating at all.
 *
 * The trigger is a rootMargin, not a ratio: a ratio threshold is unreachable
 * for any element taller than 1/threshold viewports, and the Works timeline is
 * ~14000px on a phone, so at the old 0.1 it could never fire and the whole
 * section stayed at opacity 0. A negative bottom margin gives the same
 * "it's meaningfully on screen" feel at any element height.
 */
const DEFAULTS = { x: 0, y: 28, delay: 0, duration: 700, once: true, rootMargin: '0px 0px -8% 0px' };

/* Sideways entrances belong to the desktop zigzag: below `md` the layout is a
 * single column, so an element parked at ±56px only sticks out of the viewport
 * and drags a horizontal scrollbar along with it. On a phone the offset becomes
 * a vertical one instead. */
const SINGLE_COLUMN = '(max-width: 767px)';

export default function reveal(node, options = {}) {
	const settings = { ...DEFAULTS, ...options };

	if (
		typeof IntersectionObserver === 'undefined' ||
		window.matchMedia('(prefers-reduced-motion: reduce)').matches
	) {
		return {};
	}

	const singleColumn = window.matchMedia(SINGLE_COLUMN).matches;
	const x = singleColumn ? 0 : settings.x;
	const y = singleColumn && settings.x && !settings.y ? 24 : settings.y;

	node.classList.add('reveal-hidden');
	node.style.setProperty('--reveal-x', `${x}px`);
	node.style.setProperty('--reveal-y', `${y}px`);
	node.style.setProperty('--reveal-delay', `${settings.delay}ms`);
	node.style.setProperty('--reveal-duration', `${settings.duration}ms`);

	let cleanupTimer;

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					node.classList.add('reveal-shown');
					if (settings.once) {
						observer.unobserve(node);
						// drop the reveal classes once done so the element's own
						// transitions (hover lifts etc.) aren't delayed by ours
						cleanupTimer = setTimeout(() => {
							node.classList.remove('reveal-hidden', 'reveal-shown');
						}, settings.delay + settings.duration + 80);
					}
				} else if (!settings.once) {
					node.classList.remove('reveal-shown');
				}
			}
		},
		{ threshold: 0, rootMargin: settings.rootMargin }
	);
	observer.observe(node);

	return {
		destroy: () => {
			clearTimeout(cleanupTimer);
			observer.disconnect();
		}
	};
}
