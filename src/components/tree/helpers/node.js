
export const getNodeCenter = (position, size) => {
	const center = { x: position.x - size / 2, y: position.y - size / 2 };
	return center;
};

export const getNodePositionStyle = (position) => {
	return `top: ${position.y}px; left: ${position.x}px;`;
};

export const getNodeUnderMouse = ({ nodes, node, x, y }) => {
	for (const tempNode of nodes) {
		const { position, size, id } = tempNode;
		const center = getNodeCenter(position, size)
		const isMouseOverNode =
			x >= center.x &&
			x <= center.x + size &&
			y >= center.y &&
			y <= center.y + size &&
			id !== node.id
		if (isMouseOverNode) {
			return tempNode;
		}
	}
	return null; // Return null outside of the loop if no node is found
};

export const newNodePosition = (wrapperZoomScroll, tree, nodeSize = 80) => {
	const parentCenterWidth = tree.offsetWidth / 2 * wrapperZoomScroll.scale;
	const parentCenterHeight = tree.offsetHeight / 2 * wrapperZoomScroll.scale;

	const center = {
		x: wrapperZoomScroll.x + parentCenterWidth,
		y: wrapperZoomScroll.y + parentCenterHeight
	}

	return center;
}