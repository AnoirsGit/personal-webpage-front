/*
 * "How I work with AI" as a constellation: orchestrator → role agents → evals gate → prod,
 * with the loop a failing gate takes back to the agents. Roles and the gate are the ones
 * named in the public CV (planner / coder / tester / reviewer; typecheck, linters, tests;
 * deploy with health check and rollback). Labels live in sceneText.process.
 *
 * Layout in a unit box per screen shape: left → right on wide screens, top → bottom on
 * phones. `t` orders the reveal along the flow.
 */

/** @typedef {{ id: string, kind: 'stage' | 'agent', t: number, wide: [number, number], tall: [number, number], mag: number }} ProcessNode */

/** @type {ProcessNode[]} */
export const PROCESS_NODES = [
	{ id: 'orchestrator', kind: 'stage', t: 0.0, wide: [-0.5, 0.0], tall: [0.0, 0.5], mag: 1 },
	{ id: 'planner', kind: 'agent', t: 0.22, wide: [-0.14, 0.3], tall: [-0.36, 0.13], mag: 0.62 },
	{ id: 'coder', kind: 'agent', t: 0.26, wide: [-0.1, 0.1], tall: [-0.12, 0.1], mag: 0.62 },
	{ id: 'tester', kind: 'agent', t: 0.3, wide: [-0.1, -0.1], tall: [0.12, 0.1], mag: 0.62 },
	{ id: 'reviewer', kind: 'agent', t: 0.34, wide: [-0.14, -0.3], tall: [0.36, 0.13], mag: 0.62 },
	{ id: 'evals', kind: 'stage', t: 0.6, wide: [0.2, 0.0], tall: [0.0, -0.2], mag: 0.9 },
	{ id: 'prod', kind: 'stage', t: 0.85, wide: [0.5, 0.0], tall: [0.0, -0.5], mag: 1 }
];

/**
 * from, to, bend (perpendicular bow, fraction of the length), pulse speed (laps/s, negative
 * runs backwards), pulses per line, base alpha. The retry loop bows away from the flow.
 * @type {{ from: string, to: string, bend: number, speed: number, pulses: number, base: number }[]}
 */
export const PROCESS_EDGES = [
	{ from: 'orchestrator', to: 'planner', bend: 0.12, speed: 0.32, pulses: 1, base: 0.34 },
	{ from: 'orchestrator', to: 'coder', bend: 0.05, speed: 0.36, pulses: 1, base: 0.34 },
	{ from: 'orchestrator', to: 'tester', bend: -0.05, speed: 0.34, pulses: 1, base: 0.34 },
	{ from: 'orchestrator', to: 'reviewer', bend: -0.12, speed: 0.3, pulses: 1, base: 0.34 },
	{ from: 'planner', to: 'evals', bend: -0.1, speed: 0.3, pulses: 1, base: 0.34 },
	{ from: 'coder', to: 'evals', bend: -0.04, speed: 0.34, pulses: 1, base: 0.34 },
	{ from: 'tester', to: 'evals', bend: 0.04, speed: 0.32, pulses: 1, base: 0.34 },
	{ from: 'reviewer', to: 'evals', bend: 0.1, speed: 0.28, pulses: 1, base: 0.34 },
	{ from: 'evals', to: 'prod', bend: 0, speed: 0.42, pulses: 2, base: 0.5 },
	{ from: 'evals', to: 'orchestrator', bend: -0.62, speed: 0.14, pulses: 1, base: 0.14 }
];

/** Where the "back to work" label sits: the middle of the retry loop. */
export const RETRY_EDGE = PROCESS_EDGES.length - 1;
