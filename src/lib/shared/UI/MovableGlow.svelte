<script>
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';
    
    export let color = '#ffffff';
    export let size = 5;
    export let zetIndex = 0;
    export let intensity = 0.5;
    export let position = null;

    const shadowLayers = 4; // Number of shadow layers
    const baseShadowSize = size * 20; // Base size for the shadows
    const innerShadowIntensity = size * intensity;

    const boxShadows = [];
    for (let i = 0; i < shadowLayers; i++) {
        const opacity = intensity * (shadowLayers - i) / (2 * shadowLayers); // Adjust opacity for a smoother gradient
        const blurSize = baseShadowSize * (i + 1); // Gradually increase blur size
        boxShadows.push(`0 0 ${blurSize}px ${innerShadowIntensity}px rgba(
            ${parseInt(color.slice(1, 3), 16)},
            ${parseInt(color.slice(3, 5), 16)},
            ${parseInt(color.slice(5, 7), 16)}, ${opacity})`);
    }
    const boxShadow = boxShadows.join(', ');
    console.log(boxShadows)

    const posX = tweened(0, {
        duration: 400,
        easing: cubicOut
    });
    const posY = tweened(0, {
        duration: 400,
        easing: cubicOut
    });

    $: if (position) {
        posX.set(position.x);
        posY.set(position.y);
    } else {
        posX.set(0);
        posY.set(0);
    }
</script>

<style>
    .glow {
        transition: box-shadow 0.2s ease;
    }
</style>

<div
    class="absolute glow border-1"
    style="z-index: {zetIndex}; width: 0; height: 0; box-shadow: {position ? boxShadow : 'none'}; top: {$posY}px; left: {$posX}px;">
</div>
