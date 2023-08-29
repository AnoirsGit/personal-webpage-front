export const calculateEdgeFromNodes = (p1 = { x: 0, y: 0 }, p2 = { x: 0, y: 0 }) => {
	const dx = p2.x - p1.x;
	const dy = p2.y - p1.y;

	const distance = Math.sqrt(dx * dx + dy * dy);
	const angleInRadians = Math.atan2(dy, dx);
	const angle = (-90 + (angleInRadians * 180) / Math.PI) % 360;

	return { distance, angle };
};

export const getEdgeDataFromPointAndAngle = (p1 = { x: 0, y: 0 }, distance, angle) => {
	const edgeStyle = `height: ${distance}px; top:${p1.y}px; left:${p1.x}px; transform: rotate(${angle}deg) translate(-50%);`;
	return { distance, angle, edgeStyle };
}

export const getEdgeData = (p1 = { x: 0, y: 0 }, p2 = { x: 0, y: 0 }) => {
	const { distance, angle } = calculateEdgeFromNodes(p1, p2);
	return getEdgeDataFromPointAndAngle(p1, distance, angle) //{ distance, angle, edgeStyle }
};

