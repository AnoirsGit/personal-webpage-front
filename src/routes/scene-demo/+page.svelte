<!--
	Test bench for the 3D background (not linked anywhere, noindex). Fake story sections
	drive sceneStore through `use:sceneSection`, the way the real page can.
	?bare hides the text for clean captures; ?scene=high|low|static|reduced|debug forces a mode.
-->
<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	import Scene from '$lib/scene/Scene.svelte';
	import { sceneSection, sceneStore } from '$lib/scene/sceneStore.js';
	import { onLoaded } from '$lib/shared/stores/globalStore';

	$: bare = $page.url.searchParams.has('bare');
	$: lang = $page.url.searchParams.get('lang') ?? 'en';

	const sections = [
		{
			id: 'hero',
			height: 100,
			title: 'AI-native engineer',
			text: 'Hero copy sits on the left; the Earth turns on the right.'
		},
		{
			id: 'skills',
			height: 230,
			title: 'Skills',
			text: 'Constellations draw in while this section scrolls.'
		},
		{
			id: 'process',
			height: 190,
			title: 'How I work with AI',
			text: 'Orchestrator → agents → evals → prod.'
		},
		{
			id: 'works',
			height: 210,
			title: 'Works',
			text: 'Cases with numbers. The scene steps back to a low orbit.'
		},
		{ id: 'offer', height: 160, title: 'Formats', text: 'Test week, launch, partnership.' },
		{
			id: 'contact',
			height: 120,
			title: 'Contact',
			text: 'Back to the whole Earth, home in the middle.'
		}
	];

	let state = 'pending';
	onMount(() => {
		onLoaded('aboutMe');
		const root = () => document.querySelector('.scene-root');
		const timer = setInterval(() => {
			state = root()?.getAttribute('data-scene') ?? 'none';
		}, 250);
		return () => clearInterval(timer);
	});
</script>

<svelte:head>
	<title>Scene demo</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<Scene {lang} />

<div class="demo" class:bare>
	{#each sections as section}
		<section id={section.id} use:sceneSection={section.id} style="min-height: {section.height}vh">
			<div class="copy">
				<p class="eyebrow">{section.id}</p>
				<h2>{section.title}</h2>
				<p>{section.text}</p>
			</div>
		</section>
	{/each}
</div>

{#if !bare}
	<div class="hud" aria-hidden="true">
		{$sceneStore.section} · {$sceneStore.progress.toFixed(2)} · {state}
	</div>
{/if}

<style>
	.demo section {
		position: relative;
		display: flex;
		align-items: flex-start;
		padding: 18vh 0 0;
		border-top: 1px dashed rgba(255, 255, 255, 0.06);
	}

	.copy {
		max-width: 30rem;
		color: #fff;
	}

	.eyebrow {
		font-size: 0.75rem;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: #e8c77e;
	}

	h2 {
		margin: 0.5rem 0 1rem;
		font-size: clamp(2rem, 5vw, 3.5rem);
		font-weight: 700;
		line-height: 1.05;
	}

	.bare .copy,
	.bare section {
		visibility: hidden;
		border: 0;
	}

	.hud {
		position: fixed;
		left: 12px;
		bottom: 12px;
		z-index: 50;
		padding: 6px 10px;
		border-radius: 8px;
		background: rgba(0, 0, 0, 0.6);
		color: #e8c77e;
		font: 12px/1.2 monospace;
	}
</style>
