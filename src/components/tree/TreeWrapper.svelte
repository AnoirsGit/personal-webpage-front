<script>
    export let minZoom = 1;
    export let maxZoom = 2;
    
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;
      
    const handleWheel = (event) => {
      event.preventDefault();
      const deltaY = event.deltaY;
  
      if (deltaY > 0) {
        scale = Math.max(minZoom, scale - 0.1); // Prevent zooming out below minZoom
      } else {
        scale = Math.min(maxZoom, scale + 0.1); // Prevent zooming in above maxZoom
      }
    };
  
    const handleMouseDown = (event) => {
      isDragging = true;
      offsetX = event.clientX;
      offsetY = event.clientY;
    };
  
    const handleMouseMove = (event) => {
      if (!isDragging) return;
  
      const deltaX = event.clientX - offsetX;
      const deltaY = event.clientY - offsetY;
      const container = event.target.closest('.draggable-container');
      container.scrollLeft -= deltaX;
      container.scrollTop -= deltaY;
  
      offsetX = event.clientX;
      offsetY = event.clientY;
    };
  
    const handleMouseUp = () => {
      isDragging = false;
    };
  </script>
  
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="draggable-container bg-red-200 w-full h-160 overflow-hidden {isDragging ? 'cursor-grab' : ''}"
    on:wheel={handleWheel}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    style="position: relative;"
  >
    <div
      class="draggable-content w-full h-full"
      style="
        transform-origin: top left;
        transform: scale({scale});
        overflow: hidden;
        position: absolute;
      "
    >
      <slot />
    </div>
  </div>
  