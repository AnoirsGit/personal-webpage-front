
export const getNodeCenter = (position, size) => {
	const center = { x: position.x - size / 2, y: position.y - size / 2 };
	return center;
};

export const getNodePositionStyle = (position) => {
	return `top: ${position.y}px; left: ${position.x}px;`;
};
