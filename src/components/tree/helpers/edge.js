
export const calculateEdge = (p1 = { x: 0, y: 0 }, p2 = { x: 0, y: 0 }) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const distance = Math.abs(Math.sqrt(dx * dx + dy * dy));
		const angleDegrees = 180 / Math.PI * Math.acos(dy / distance);

    const edgeStyle = `height: ${distance}px; top:${p1.y}px; left:${p1.x}px; transform: rotate(${angleDegrees}deg);`;

    return { distance, angle: angleDegrees, edgeStyle };
};

export const getEdges = (nodes) => {
	const edges = [];

	for (let i = 0; i < nodes.length - 1; i++) {
		const edge = calculateEdge(nodes[i].position, nodes[i + 1].position);
		edges.push(edge);
	}

	return edges;
};
