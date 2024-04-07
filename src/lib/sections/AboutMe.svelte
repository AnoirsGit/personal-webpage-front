<script>
	import '$lib/app/styles/sections/AboutMe.css';
	import CustomButton from '$lib/shared/UI/CustomButton.svelte';
	import SectionLayout from '$lib/shared/UI/SectionLayout.svelte';
	import Typing3D from '$lib/widgets/typing-3d/Typing3D.svelte';
	import Icon from '@iconify/svelte';
	import MarkdownWrapper from '$lib/shared/MarkdownWrapper.svelte';

	export let firstBlockDescription = `# Based in Kazakhstan. I’m FullStack developer.

Passionate developer with experience in both frontend and backend, dedicated to creating
			innovative and efficient web applications. My skills include not only technical depth but also
			the ability to understand and solve business challenges, making me the ideal candidate for
			your project.`;

	export let secondBlockDescription = `Lorem ipsum dolor sit amet consectetur. Leo cum a pellentesque morbi vel amet velit. Quam
					lacinia ut eu enim porta turpis a hendrerit. Sed interdum elementum donec sit. Tortor
					vivamus sapien vulputate non elementum leo massa vitae.`;
</script>

<div class="about-me">
	<div class="left-block">
		<h1 class="header-1">Hi, <br /> I'm <span class="text-main-purple">Anuar</span></h1>
		<p>FullStack developer</p>
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
		<MarkdownWrapper source={firstBlockDescription} mdClasses="sm text-text-1 description" />
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

<SectionLayout title="About me">
	<div class="about-me-2">
		<div class="content-block">
			<div class="flex flex-col gap-6">
				<div class="description-block">
					<MarkdownWrapper source={secondBlockDescription} />
				</div>
				<div class="mx-auto"><CustomButton>Hire me</CustomButton></div>
			</div>
			<Typing3D />
		</div>
	</div>
</SectionLayout>
