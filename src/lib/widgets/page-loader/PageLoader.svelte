<script>
	import { fade, fly } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import '$lib/app/styles/page-loader.css';
</script>

<div
	out:fly={{ delay: 150, duration: 600, opacity: 1, x: '100vw', easing: cubicInOut }}
	class="app-loader-wrapper"
>
	<div out:fade={{ duration: 200 }} class="page-loader">
		<div class="loader-emblem">
			<div class="loader-ring" />
			<div class="loader-ring loader-ring-secondary" />
			<img class="loader-logo" src="images/logo.svg" alt="Anuar logo" />
		</div>
		<div class="loader-caption">
			<span class="loader-name">ANUAR</span>
			<span class="loader-dots"><i /><i /><i /></span>
		</div>
	</div>
</div>
<div
	out:fly={{ delay: 300, duration: 600, opacity: 1, x: '100vw', easing: cubicInOut }}
	class="app-loader-second-wrapper"
/>
<div
	out:fly={{ delay: 450, duration: 600, opacity: 1, x: '100vw', easing: cubicInOut }}
	class="app-loader-third-wrapper"
/>
<div
	out:fly={{ delay: 600, duration: 650, opacity: 1, x: '100vw', easing: cubicInOut }}
	class="app-loader-fourth-wrapper"
/>
