/*
 * Words the scene itself draws: process-graph stages and place labels. The page carries the
 * real copy in HTML; these labels are decoration (aria-hidden) and repeat only facts already
 * public on the site or in the CV. Constellation names, skill titles and their short texts
 * come from buildConstellations() (content.skill-tree.js), the home city from
 * src/lib/config/site-config.json.
 */

/** @typedef {'en' | 'ru'} SceneLang */

export const SCENE_TEXT = {
	en: {
		home: 'Home base',
		process: {
			title: 'How work flows',
			orchestrator: [
				'Orchestrator',
				'Splits the task, gives each agent a role, a model and a budget'
			],
			planner: ['Planner', 'Plans the change on a strong model'],
			coder: ['Coder', 'Writes the code in its own sandbox and git worktree'],
			tester: ['Tester', 'Runs the tests'],
			reviewer: ['Reviewer', 'Reviews the change'],
			evals: ['Evals', 'Eval harness with A/B runs; types, linters and tests gate every change'],
			prod: ['Prod', 'Ships with a health check and automatic rollback'],
			retry: ['Back to work', 'A failing gate sends the work back to the agent, not to a human']
		},
		places: {
			almaty: ['Almaty', 'Mercury Properties · NCRM · WoCards'],
			astana: ['Astana', 'Solution Architects · remote contract, 2024–2025'],
			sanfrancisco: ['San Francisco', 'POWR.io · remote US team, 2021–2024'],
			china: ['China', 'MercuryX · B2B sourcing and import']
		}
	},
	ru: {
		home: 'Дом',
		process: {
			title: 'Как идёт работа',
			orchestrator: ['Оркестратор', 'Делит задачу, даёт каждому агенту роль, модель и бюджет'],
			planner: ['Планировщик', 'Планирует изменение на сильной модели'],
			coder: ['Кодер', 'Пишет код в своей песочнице и своём git worktree'],
			tester: ['Тестировщик', 'Гоняет тесты'],
			reviewer: ['Ревьюер', 'Ревьюит изменение'],
			evals: [
				'Evals',
				'Eval-харнесс с A/B-прогонами; типы, линтеры и тесты — гейт для каждого изменения'
			],
			prod: ['Прод', 'Выкатка с health-check и автоматическим откатом'],
			retry: ['Обратно в работу', 'Красный гейт возвращает работу агенту, а не человеку']
		},
		places: {
			almaty: ['Алматы', 'Mercury Properties · NCRM · WoCards'],
			astana: ['Астана', 'Solution Architects · удалённый контракт, 2024–2025'],
			sanfrancisco: ['Сан-Франциско', 'POWR.io · удалённая команда из США, 2021–2024'],
			china: ['Китай', 'MercuryX · B2B-закупки и импорт']
		}
	}
};

/** @param {string | null | undefined} lang */
export const sceneLang = (lang) =>
	String(lang ?? '')
		.toLowerCase()
		.startsWith('ru')
		? 'ru'
		: 'en';

/**
 * "UTC+5" for an IANA zone, or '' when the browser cannot format it.
 * @param {string | undefined} timeZone
 */
export const utcOffsetLabel = (timeZone) => {
	if (!timeZone) return '';
	try {
		const part = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
			.formatToParts(new Date())
			.find(({ type }) => type === 'timeZoneName');
		return part ? part.value.replace('GMT', 'UTC').replace(/^UTC$/, 'UTC±0') : '';
	} catch {
		return '';
	}
};
