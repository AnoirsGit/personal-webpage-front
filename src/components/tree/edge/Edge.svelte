<script>
	import { randomColorGenerator } from '../helpers/colorGenerator';
	import { getEdgeData } from '../helpers/edge';

	export let width = 1;
	export let color = randomColorGenerator();
	export let sourcePoint;
	export let targetPoint;
	
	let widthPx = `${width * 4}px`;
	let edgeStyle;
	let style;
	$: edgeStyle = getEdgeData(sourcePoint, targetPoint).edgeStyle;
	$: style = `background: ${color}; width: ${widthPx}; ${edgeStyle}`;
</script>

<div class="absolute z-edge origin-top-left bg-[{color}]" style={style} />
