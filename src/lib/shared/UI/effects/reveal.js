/*
 * Svelte action: fades + slides an element in when it enters the viewport.
 * Styling lives in app.css (.reveal-hidden / .reveal-shown).
 * Honors prefers-reduced-motion by not animating at all.
 */
const DEFAULTS = { x: 0, y: 28, delay: 0, duration: 700, once: true, threshold: 0.1 };

export default function reveal(node, options = {}) {
	const settings = { ...DEFAULTS, ...options };

	if (
		typeof IntersectionObserver === 'undefined' ||
		window.matchMedia('(prefers-reduced-motion: reduce)').matches
	) {
		return {};
	}

	node.classList.add('reveal-hidden');
	node.style.setProperty('--reveal-x', `${settings.x}px`);
	node.style.setProperty('--reveal-y', `${settings.y}px`);
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
		{ threshold: settings.threshold }
	);
	observer.observe(node);

	return {
		destroy: () => {
			clearTimeout(cleanupTimer);
			observer.disconnect();
		}
	};
}
