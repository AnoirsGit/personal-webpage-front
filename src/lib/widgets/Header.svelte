<script>
	import '$lib/app/styles/header.css';
	import CustomButton from '$lib/shared/UI/CustomButton.svelte';
</script>

<header>
	<div class="header-wrapper header-border">
		<div class="app-content h-full flex items-center justify-between relative">
			<h1 class="text-2xl">Anuar</h1>
			<div class="h-full flex gap-10">
				<div class="nav-item flex-center"><a href="">About me</a></div>
				<div class="nav-item flex-center"><a href="">Skills</a></div>
				<div class="nav-item flex-center"><a href="">Works</a></div>
				<div class="nav-item flex-center"><a href="">Contacts</a></div>
				<div class="nav-item flex-center"><a href="">Entertainment</a></div>
			</div>
			<CustomButton color="dark">Hire me</CustomButton>
		</div>
	</div>
	<!-- Header content goes here -->
</header>
