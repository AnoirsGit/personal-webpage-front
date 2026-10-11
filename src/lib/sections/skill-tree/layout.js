/*
 * Where every node of the skill tree goes on wide screens. The root sits on top, the five
 * groups of buildConstellations() hang from it as branches (columns), and each branch is a
 * crown: the group's lead on the trunk, then rows one node wider each time, so the most
 * important skills sit nearest the root. A row hangs from the trunk on short ribs: a line
 * means "this branch, this rank", never a dependency the data does not have (the tree's
 * own links between skills light up on hover instead, see SkillTree.svelte).
 *
 * Only grid placement comes out of here — columns, rows, and offsets measured in cells —
 * never pixels: the rows take the height of their real, wrapped labels, so a long name or
 * the Russian page can never push a label into the row below. Pure and deterministic, so
 * the prerender and the browser agree and nothing moves on hydration.
 */

/** Grid cells across the whole tree; every branch gets a share of them. */
export const TOTAL_COLUMNS = 13;
const MIN_COLUMNS = 2;

/** Row sizes of a crown: 1, 2, 3 … up to `columns`, then `columns` until the skills run out. */
export const crownRows = (count, columns) => {
	const rows = [];
	for (let size = 1, left = count; left > 0; size++) {
		const take = Math.min(size, columns, left);
		rows.push(take);
		left -= take;
	}
	return rows;
};

/** Columns per branch: two each, every spare one to whichever branch is tallest. */
export const allocateColumns = (counts, total = TOTAL_COLUMNS) => {
	const columns = counts.map(() => MIN_COLUMNS);
	for (let used = MIN_COLUMNS * counts.length; used < total; used++) {
		let pick = 0;
		let tallest = -1;
		counts.forEach((count, i) => {
			const rows = crownRows(count, columns[i]).length;
			if (rows > tallest || (rows === tallest && count > counts[pick])) {
				tallest = rows;
				pick = i;
			}
		});
		columns[pick]++;
	}
	return columns;
};

/** Offsets of a row's slots from the trunk, in cells, most important first: centre out, left first. */
const centreOut = (size) =>
	Array.from({ length: size }, (_, i) => i - (size - 1) / 2).sort(
		(a, b) => Math.abs(a) - Math.abs(b) || a - b
	);

const round = (value) => Math.round(value * 10000) / 10000;

/**
 * @typedef {{
 *   row: number,        // 0 = the lead's row
 *   column: number,     // first of the two half-cell grid columns the node spans (0-based)
 *   trunk: number,      // the trunk's x from the node cell's left edge, in cell widths
 *   rib: [number, number] | null, // the rib from the node to the trunk: [left, width] in cell widths
 *   side: -1 | 0 | 1,   // left of the trunk, on it, right of it
 *   trunkRow: boolean,  // this node draws its row's piece of the trunk
 *   lastRow: boolean
 * }} Slot
 * @typedef {{
 *   columns: number,    // cells across this branch
 *   start: number,      // the branch's first cell in the whole tree
 *   rows: number,
 *   root: number,       // the root's x from the branch's left edge, in branch widths
 *   slots: Slot[]       // one per skill, in the group's (importance) order
 * }} BranchLayout
 */

/**
 * @param {{ stars: unknown[] }[]} groups
 * @returns {{ total: number, branches: BranchLayout[] }}
 */
export const layoutTree = (groups) => {
	const columns = allocateColumns(groups.map((group) => group.stars.length));
	const total = columns.reduce((sum, value) => sum + value, 0);
	let start = 0;

	const branches = groups.map((group, g) => {
		const width = columns[g];
		const rows = crownRows(group.stars.length, width);
		/** @type {Slot[]} */
		const slots = [];
		rows.forEach((size, row) => {
			centreOut(size).forEach((offset, i) => {
				// half-cell grid: the trunk runs at half-cell `width`, a node spans two half-cells
				const column = width + 2 * offset - 1;
				const trunk = (width - column) / 2;
				slots.push({
					row,
					column,
					trunk,
					rib: offset === 0 ? null : [Math.min(0.5, trunk), Math.abs(trunk - 0.5)],
					side: offset < 0 ? -1 : offset > 0 ? 1 : 0,
					trunkRow: i === 0,
					lastRow: row === rows.length - 1
				});
			});
		});
		const branch = {
			columns: width,
			start,
			rows: rows.length,
			root: round((total / 2 - start) / width),
			slots
		};
		start += width;
		return branch;
	});

	return { total, branches };
};

const VOWEL = /[аеёиоуыэюя]/i;
const CONSONANT = /[бвгджзклмнпрстфхцчшщ]/i;

/**
 * A soft hyphen (U+00AD) in every Cyrillic word of 13+ letters, at the syllable boundary
 * (after a vowel, before a consonant, five letters or more on each side) nearest its middle.
 * The tree's cells are narrow and Russian words long; browsers without a Russian hyphenation
 * dictionary would otherwise push such a word into its neighbour. Display only: the hyphen
 * shows when the line breaks there, screen readers skip it, the data keeps the plain name.
 * @param {string} text
 */
export const softHyphens = (text) =>
	text.replace(/[а-яё]{13,}/gi, (word) => {
		let best = -1;
		for (let i = 5; i <= word.length - 5; i++) {
			if (!VOWEL.test(word[i - 1]) || !CONSONANT.test(word[i])) continue;
			if (best < 0 || Math.abs(i - word.length / 2) < Math.abs(best - word.length / 2)) best = i;
		}
		return best < 0 ? word : `${word.slice(0, best)}\u00ad${word.slice(best)}`;
	});
