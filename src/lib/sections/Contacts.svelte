<script>
	import SectionLayout from '$lib/shared/UI/SectionLayout.svelte';
	import Globe from '$lib/widgets/globe/Globe.svelte';
	import '$lib/app/styles/globe.css';

	import WiTime5 from 'svelte-icons/wi/WiTime5.svelte';
	import MdEmail from 'svelte-icons/md/MdEmail.svelte';
	import MdCall from 'svelte-icons/md/MdCall.svelte';
	import MdLocationOn from 'svelte-icons/md/MdLocationOn.svelte';
	import DiGithubBadge from 'svelte-icons/di/DiGithubBadge.svelte';
	import IoLogoLinkedin from 'svelte-icons/io/IoLogoLinkedin.svelte';
	import FaTelegramPlane from 'svelte-icons/fa/FaTelegramPlane.svelte';
</script>

<SectionLayout title="Contacts">
	<Globe />
	<div class="absolute flex items-center gap-1 right-24">
		<div class="w-8 h-8"><WiTime5 /></div>
		<p class="pt-1">Asia / Almaty ( UTC+5 )</p>
	</div>
	<div class="flex globe-wrapper-h">
		<div class="flex mt-40">
			<ul class="text-lg flex flex-col gap-4">
				<li class="flex gap-2 items-center">
					<div class="w-8 h-8 mr-2"><MdEmail /></div>
					<p>anoirsmail@gmail.com</p>
				</li>

				<li class="flex gap-2 items-center">
					<div class="w-8 h-8 mr-2"><MdCall /></div>
					<p>+ 8 (707)-911-69-92</p>
				</li>
				<li class="flex gap-2 items-center">
					<div class="w-8 h-8 mr-2"><MdLocationOn /></div>
					<p>Almaty/Kazakhstan</p>
				</li>
				<li class="flex gap-2 items-center">
					<div class="w-8 h-8 mr-2"><DiGithubBadge /></div>
					<p>AnoirsGit</p>
				</li>
				<li class="flex gap-2 items-center">
					<div class="w-8 h-8 mr-2"><IoLogoLinkedin /></div>
					<a href="https://www.linkedin.com/in/anoir-beibit-73218a215/">Anoir Beibit</a>
				</li>
				<li class="flex gap-2 items-center">
					<div class="w-8 h-8 mr-2"><FaTelegramPlane /></div>
					<p>@NiorBegula</p>
				</li>
			</ul>
		</div>
	</div>
</SectionLayout>
