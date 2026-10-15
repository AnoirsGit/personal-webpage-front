import assert from 'node:assert/strict';
import { test } from 'node:test';

import { crownRows, layoutTree, TAB_COLUMNS } from './layout.js';

const group = (count) => ({ stars: Array.from({ length: count }, (_, i) => ({ id: `s${i}` })) });

test('a crown grows one node per row by default', () => {
	assert.deepEqual(crownRows(12, 4), [1, 2, 3, 4, 2]);
	assert.deepEqual(crownRows(3, 2), [1, 2]);
});

test('a crown can grow two nodes per row, capped at its columns', () => {
	assert.deepEqual(crownRows(30, 9, 2), [1, 3, 5, 7, 9, 5]);
	assert.deepEqual(crownRows(12, 9, 2), [1, 3, 5, 3]);
	assert.deepEqual(crownRows(9, 9, 2), [1, 3, 5]);
	assert.deepEqual(crownRows(30, 5, 2), [1, 3, 5, 5, 5, 5, 5, 1]);
});

test('every skill of every real branch size gets a slot', () => {
	for (const count of [1, 9, 12, 13, 22, 30, 41]) {
		assert.equal(
			crownRows(count, TAB_COLUMNS, 2).reduce((sum, size) => sum + size, 0),
			count
		);
	}
});

test('one branch on its own takes every column, centred under the root', () => {
	const { total, branches } = layoutTree([group(30)], TAB_COLUMNS, 2);
	const [branch] = branches;
	assert.equal(total, TAB_COLUMNS);
	assert.equal(branch.columns, TAB_COLUMNS);
	assert.equal(branch.root, 0.5);
	assert.equal(branch.rows, 6);
	assert.equal(branch.slots.length, 30);

	const rows = Map.groupBy(branch.slots, (slot) => slot.row);
	for (const [row, slots] of rows) {
		// a node spans two half-cells of a grid of 2 × columns
		for (const slot of slots) {
			assert.ok(slot.column >= 0 && slot.column + 2 <= 2 * TAB_COLUMNS, `row ${row} inside`);
		}
		// one node per row draws the trunk, and the row is centred on it
		assert.equal(slots.filter((slot) => slot.trunkRow).length, 1);
		const mean = slots.reduce((sum, slot) => sum + slot.column + 1, 0) / slots.length;
		assert.equal(mean, TAB_COLUMNS);
		// no two nodes of a row overlap
		const starts = slots.map((slot) => slot.column).sort((a, b) => a - b);
		starts.slice(1).forEach((start, i) => assert.ok(start - starts[i] >= 2));
	}
	assert.ok(branch.slots.at(-1).lastRow);
});

test('the five-branch crown is unchanged', () => {
	const { total, branches } = layoutTree([group(12), group(9), group(30), group(22), group(13)]);
	assert.equal(total, 13);
	assert.deepEqual(
		branches.map((branch) => branch.columns),
		[2, 2, 4, 3, 2]
	);
});
