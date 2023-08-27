<script>
  import { getNodeCenter, getNodePositionStyle} from './helpers/node'
  export let node ;

  const positionStyle = getNodePositionStyle(getNodeCenter(node.position, node.size))
</script>

<div class="absolute w-20 h-20 bg-red-400" style={positionStyle}>
</div>