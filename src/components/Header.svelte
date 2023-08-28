<script>
  import "../styles/header.css";
  import MdKeyboardArrowDown from 'svelte-icons/md/MdKeyboardArrowDown.svelte'
</script>

<header>
  <div class="flex py-2 justify-between items-center">
    <h1 class="text-3xl font-bold">Noir</h1>
    <div class="flex justify-between gap-6">
      <div class="nav-item">Home</div>
      <div class="nav-item">Portfolio</div>
      <div class="nav-item">Skill tree</div>
      <div class="nav-item">Contact me</div>
      <div class="nav-item flex items-center">
        <div class="">Nav</div>
        <div class="text-gray-400 w-5 h-5"><MdKeyboardArrowDown  /></div>
      </div>
    </div>
    <div class="text-base">Log in</div>
  </div>
  <!-- Header content goes here -->
</header>
