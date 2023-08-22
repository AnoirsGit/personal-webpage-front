<script>
	import MdHome from 'svelte-icons/md/MdHome.svelte';

	export let topLineParams = {
		gradientStart: '#6600cc',
		gradientEnd: '#cc66ff',
		height: 320
	};

	export let botLineParams = {
		gradientStart: '#cc66ff',
		gradientEnd: '#ff5050',
		height: 320
	};

	const fullHeight = botLineParams.height + topLineParams.height + 32 + 24 * 2;
</script>

<div class="w-8 lg:w-24" style="height: {fullHeight}px">
	<div class="relative" style="height: {topLineParams.height}px;">
		<div
			class="w-1 rounded-full abs-center"
			style="height: 90%; background: linear-gradient( {topLineParams.gradientStart} 50%,{topLineParams.gradientEnd} 90%, rgba(255,255,255, 0.7)  100%);"
		/>
	</div>

  <div class="w-8 h-8 relative text-white mx-auto flex items-center justify-center">
    <div class="z-40">
      <slot name="icon"><MdHome /></slot>
    </div>
    <div class="abs-center z-0" style="box-shadow: 0 0 50px 20px #48abe0;"></div>
  </div>
	<div class="relative w-full" style="height: {botLineParams.height}px;">
		<div
			class="w-1 rounded-full abs-center"
			style="height: 90%; background: linear-gradient(rgba(255,255,255, 0.7) 0%,{topLineParams.gradientStart} 10%, {botLineParams.gradientEnd} 100%);"
		/>
	</div>
</div>
