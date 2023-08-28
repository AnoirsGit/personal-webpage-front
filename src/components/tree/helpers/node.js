
export const getNodeCenter = (position, size) => {
	const center = { x: position.x - size / 2, y: position.y - size / 2 };
	return center;
};

export const getNodePositionStyle = (position) => {
	return `left: ${position.x}px; top: ${position.y}px;`;
};
