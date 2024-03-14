<script>
	import { fly, slide } from 'svelte/transition';
	import '$lib/app/styles/page-loader.css';
</script>

<div transition:slide={{ duration: 500, axis: 'x' }} class="app-loader-wrapper">
	<div class="page-loader w-full h-full flex-center">
		<svg>
			<g>
				<path d="M 50,100 A 1,1 0 0 1 50,0" />
			</g>
			<g>
				<path d="M 50,75 A 1,1 0 0 0 50,-25" />
			</g>
			<defs>
				<linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" style="stop-color:#9122FF;stop-opacity:1" />
					<stop offset="100%" style="stop-color:#e066ff;stop-opacity:1" />
				</linearGradient>
			</defs>
		</svg>
	</div>
</div>
<div
	out:fly={{ delay: 1100, duration: 500, opacity: 1, x: '100vw' }}
	class="app-loader-second-wrapper"
/>
<div
	out:fly={{ delay: 1300, duration: 450, opacity: 1, x: '100vw' }}
	class="app-loader-third-wrapper"
/>
<div
	out:fly={{ delay: 1450, duration: 400, opacity: 1, x: '100vw' }}
	class="app-loader-fourth-wrapper"
/>
