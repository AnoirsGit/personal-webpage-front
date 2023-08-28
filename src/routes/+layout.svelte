<script>
  import "../styles/app.css";
  import Header from "../components/Header.svelte";
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