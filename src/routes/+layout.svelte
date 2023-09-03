<script>
  import '$lib/styles/app.css'
  import Header from "$lib/components/Header.svelte";
</script>

<main class='app'>
  <div class="app-content">
    <Header />
    
    <slot></slot>
    
    <footer>
      <!-- Footer content goes here -->
    </footer>
  </div>
</main>