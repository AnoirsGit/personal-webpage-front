<script>
	import '$lib/app/styles/sections/AboutMe.css';
	import CustomButton from '$lib/shared/UI/CustomButton.svelte';
	import Icon from '@iconify/svelte';
</script>

<div class="about-me">
	<div class="left-block">
		<h1 class="header-1">Hi, <br /> I'm <span class="text-main-purple">Anuar</span></h1>
		<p>Full Stack developer</p>
		<CustomButton size="no">
			<div class="lets-chat-btn">
				<p>Let's chat</p>
				<div class="icon-wrapper">
					<Icon icon="icon-park-outline:telegram" />
				</div>
			</div>
		</CustomButton>
	</div>
	<div class="picture-wrapper">
		<img class="picture" src="/images/about-me-bg.webp" alt="" />
	</div>
	<div class="right-block">
		<h3>Based in Kazakhstan. I’m Frontend and Backend developer.</h3>
		<p class="description">
			Passionate developer with experience in both frontend and backend, dedicated to creating
			innovative and efficient web applications. My skills include not only technical depth but also
			the ability to understand and solve business challenges, making me the ideal candidate for
			your project.
		</p>
		<CustomButton color="transparent">
			<div class="download-btn">
				<p>Download</p>
				<div class="text-2xl">
					<Icon icon="octicon:download-16" />
				</div>
			</div>
		</CustomButton>
	</div>
</div>
