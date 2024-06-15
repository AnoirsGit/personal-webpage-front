<script>
	import '$lib/app/styles/sections/AboutMe.css';
	import CustomButton from '$lib/shared/UI/CustomButton.svelte';
	import SectionLayout from '$lib/shared/UI/SectionLayout.svelte';
	import Typing3D from '$lib/widgets/typing-3d/Typing3D.svelte';
	import Icon from '@iconify/svelte';
	import MarkdownWrapper from '$lib/shared/MarkdownWrapper.svelte';

	export let firstBlockDescription = `# Based in Kazakhstan. I’m FullStack developer.
With 4+ years as a team lead full stack developer, my forte lies in tackling intricate technical challenges and resolving a problem with an analytical way.

But my true strength shines in fostering open communication within the team.`
	export let secondBlockDescription = `Coding isn't just a job for me, it's a source of pure joy.
Unraveling complex problems and crafting solutions.  The thrill of the "aha!" moment and seeing my 
creations come to life fuels my passion for development.

My ultimate goal?  A fulfilling career built around the things that bring me the most joy: coding and problem-solving.`;
</script>

<section class="about-me">
	<div class="left-block">
		<h1 class="header-1">Hi, <br /> I'm <span class="text-main-purple">Anuar</span></h1>
		<p>FullStack developer</p>
		<CustomButton type="link" href="https://t.me/NoirBegula" size="no">
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
		<MarkdownWrapper mdClasses="lg mh-4 mobile-lg white-code text-card-gray description" source={firstBlockDescription} />

		<CustomButton
			type="link"
			href="https://drive.google.com/file/d/1gj_nk1-2wxgSTNRRjcgmthXNmFQlIwyd/view?usp=sharing"
			color="transparent"
		>
			<div class="download-btn">
				<p>Download</p>
				<div class="text-2xl">
					<Icon icon="octicon:download-16" />
				</div>
			</div>
		</CustomButton>
	</div>
</section>

<SectionLayout title="About me">
	<div class="about-me-2">
		<div class="content-block -mt-8">
			<div class="h-full flex flex-col gap-24">
				<div class="description-block">
					<MarkdownWrapper mdClasses="lg mh-4 mobile-lg white-code text-card-grey description" source={secondBlockDescription} />
				</div>
				<div class="mx-auto"><CustomButton>Hire me</CustomButton></div>
			</div>
			<Typing3D />
		</div>
	</div>
</SectionLayout>
