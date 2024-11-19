<script>
	import Icon from '@iconify/svelte';

	import '$lib/app/styles/sections/AboutMe.css';
	import Typing3D from '$lib/widgets/typing-3d/Typing3D.svelte';
	import CustomButton from '$lib/shared/UI/CustomButton.svelte';
	import MarkdownWrapper from '$lib/shared/MarkdownWrapper.svelte';
	import { onLoaded } from '$lib/shared/stores/globalStore';
	import { aboutMe } from '$lib/shared/mocks/about-me.json';

	export let firstSection = aboutMe.firstBlock;
	export let secondSection = aboutMe.secondBlock;

	let imageLoaded = false;
	let typing3DLoaded = false;

	const checkAllLoaded = () => {
		if (imageLoaded && typing3DLoaded) {
			onLoaded('aboutMe');
		}
	};

	const handleImageLoad = () => {
		imageLoaded = true;
		checkAllLoaded();
	};

	const handleTyping3DLoad = () => {
		typing3DLoaded = true;
		checkAllLoaded();
	};
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
		<img on:load|once={handleImageLoad} class="picture" src="/images/about-me-bg.webp" alt="" />
	</div>
	<div class="right-block">
		<MarkdownWrapper
			mdClasses="lg mh-4 mobile-lg white-code text-card-gray description"
			source={firstSection}
		/>

		<CustomButton
			type="link"
			href="https://drive.google.com/file/d/1kq_k19j_w_TIPGk-7Dm1BrYMb-n7xJxf/view?usp=sharing"
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

<div class="about-me-2">
	<div class="content-block -mt-8">
		<div class="h-full flex flex-col gap-24">
			<div class="description-block">
				<MarkdownWrapper
					mdClasses="lg mh-4 mobile-lg white-code text-card-grey description"
					source={secondSection}
				/>
			</div>
			<div class="mx-auto">
				<CustomButton
					additionalClasses="flex gap-3 items-center"
					type="link"
					href="https://github.com/AnoirsGit/personal-webpage-front"
					><Icon class="text-3xl" icon="mdi:github" /> Repository</CustomButton
				>
			</div>
		</div>
		<Typing3D onLoaded={handleTyping3DLoad} />
	</div>
</div>
