<script>
  export let width = 1;
  export let color=  '#0000ff'
  export let classes = ''
  export let edgeStyle = `height: ${10}px; top:${0}px; left:${0}px; transform: rotate(${0}deg);`;
  
  let widthPx = `${width * 4}px`
  let style = `background: ${color}; width: ${widthPx}; ${edgeStyle}` 

</script>

<div
class="absolute origin-top-left  w-{width} bg-[{color}] {classes}"
{style}
/>