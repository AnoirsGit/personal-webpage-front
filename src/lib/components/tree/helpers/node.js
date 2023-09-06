import { generateRandomID } from './helper';
import { DEFAULT_NODE_SIZES } from '$lib/consts/nodeConsts';

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
		const center = getNodeCenter(position, size);
		const isMouseOverNode =
			x >= center.x &&
			x <= center.x + size &&
			y >= center.y &&
			y <= center.y + size &&
			id !== node.id;
		if (isMouseOverNode) {
			return tempNode;
		}
	}
	return null; // Return null outside of the loop if no node is found
};

export const calculateCenterOfTreeToAddNode = (wrapperZoomScroll, tree, nodeSize = 80) => {
	const parentCenterWidth = tree.offsetWidth / 2;
	const parentCenterHeight = tree.offsetHeight / 2;

	// Calculate the adjusted center position
	const center = {
		x: wrapperZoomScroll.x / wrapperZoomScroll.scale + parentCenterWidth - nodeSize / 2,
		y: wrapperZoomScroll.y / wrapperZoomScroll.scale + parentCenterHeight - nodeSize / 2
	};

	return center;
};

export const addNodeToTree = (nodes, wrapperZoomScroll, tree, treeId, params) => {
	const size = params?.size || DEFAULT_NODE_SIZES.default;
	const nodePosition = calculateCenterOfTreeToAddNode(wrapperZoomScroll, tree, size);
	let mockId;

	do {
		mockId = `mock-${generateRandomID(6)}`;
	} while (nodes.some((node) => node.id === mockId));

	return {
		size,
		treeId,
		id: mockId,
		isActive: false,
		position: nodePosition
	};
};
