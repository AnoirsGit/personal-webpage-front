import { generateRandomID } from '../color-helper';
import { NODE_DEFAULT_SIZE } from '$lib/shared/consts/nodeConsts';

export const getNodeCenter = (position, size = NODE_DEFAULT_SIZE) => {
	const center = { x: position.x - size / 2, y: position.y - size / 2 };
	return center;
};

export const getNodePositionStyle = (position) => {
	return `top: ${position.y}px; left: ${position.x}px;`;
};

export const getNodeUnderMouse = ({ nodes, node, x, y }) => {
	for (const tempNode of nodes) {
		const { position, id } = tempNode;
		const size = tempNode.size | NODE_DEFAULT_SIZE;
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

export const calculateCenterOfTreeToAddNode = (wrapperZoomScroll, tree, ) => {
	const parentCenterWidth = (tree.offsetWidth / 2)/ wrapperZoomScroll.scale;
	const parentCenterHeight = (tree.offsetHeight / 2)/ wrapperZoomScroll.scale;
	// Calculate the adjusted center position
	const center = {
		x: wrapperZoomScroll.x / wrapperZoomScroll.scale + parentCenterWidth ,
		y: wrapperZoomScroll.y / wrapperZoomScroll.scale + parentCenterHeight
	};

	return center;
};

export const addNodeToTree = (nodes, wrapperZoomScroll, tree, treeId, params) => {
	const size = params?.size;
	const nodePosition = calculateCenterOfTreeToAddNode(wrapperZoomScroll, tree, size);
	let mockId;

	do {
		mockId = `mock-${generateRandomID(6)}`;
	} while (nodes.some((node) => node.id === mockId));

	return {
		size,
		treeId,
		title: '',
		description: '',
		isNode: true,
		id: mockId,
		tags: [],
		isActive: false,
		position: nodePosition
	};
};
