/*
 * Svelte action: the element leans toward the pointer while it hovers, and
 * settles back when the pointer leaves. Mouse/trackpad only; nothing moves for
 * touch or with prefers-reduced-motion.
 */
export default function magnetic(node, { strength = 0.22 } = {}) {
	if (
		typeof window === 'undefined' ||
		!window.matchMedia('(hover: hover) and (pointer: fine)').matches ||
		window.matchMedia('(prefers-reduced-motion: reduce)').matches
	) {
		return {};
	}

	let frame = 0;

	const move = (event) => {
		const rect = node.getBoundingClientRect();
		const x = (event.clientX - (rect.left + rect.width / 2)) * strength;
		const y = (event.clientY - (rect.top + rect.height / 2)) * strength;
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			node.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
		});
	};

	const leave = () => {
		cancelAnimationFrame(frame);
		node.style.transform = '';
	};

	node.addEventListener('pointermove', move);
	node.addEventListener('pointerleave', leave);

	return {
		destroy() {
			cancelAnimationFrame(frame);
			node.removeEventListener('pointermove', move);
			node.removeEventListener('pointerleave', leave);
		}
	};
}
