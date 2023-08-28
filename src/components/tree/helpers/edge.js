export const calculateEdgeFromNodes = (point1 = { x: 0, y: 0 }, point2 = { x: 0, y: 0 }) => {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;

  const distance = Math.sqrt(dx * dx + dy * dy);
  const angleInRadians = Math.atan2(dy, dx);
  const angle = (-90 + (angleInRadians * 180) / Math.PI) % 360;

  return { distance, angle };
};

export const getEdgeDataFromPointAndAngle = (p1= { x: 0, y: 0 }, distance, angle) => {
	const edgeStyle = `height: ${distance}px; top:${p1.y}px; left:${p1.x}px; transform: rotate(${angle}deg) translate(-50%);`;
	return { distance, angle, edgeStyle };
}

export const getEdgeDataFromNodes = (p1 = { x: 0, y: 0 }, p2 = { x: 0, y: 0 }) => {
	const { distance, angle } = calculateEdgeFromNodes(p1, p2);
	return getEdgeDataFromPointAndAngle(p1, distance, angle)
};


export const getEdges = (nodes) => {
	if(!nodes) return

	const edges = [];

	for (let i = 0; i < nodes.length - 1; i++) {
		const edge = getEdgeDataFromNodes(nodes[i].position, nodes[i + 1].position);
		edges.push(edge);
	}

	return edges;
};
