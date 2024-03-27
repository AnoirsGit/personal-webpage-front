<script>
	import SectionLayout from '$lib/shared/UI/SectionLayout.svelte';
	import Globe from '$lib/widgets/globe/Globe.svelte';
	import '$lib/app/styles/globe.css';
	import '$lib/app/styles/contacts.css';

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
		<p class="text-sm lg:text-base pt-1">Asia / Almaty ( UTC+5 )</p>
	</div>
	<div class="flex">
		<div class="contacts">
			<ul class="contact-list">
				<li class="contact-item">
					<div class="contact-item-icon"><MdEmail /></div>
					<p class="contact-link">anoirsmail@gmail.com</p>
				</li>

				<li class="contact-item">
					<div class="contact-item-icon"><MdCall /></div>
					<p class="contact-link">+ 8 (707)-911-69-92</p>
				</li>
				<li class="contact-item">
					<div class="contact-item-icon"><MdLocationOn /></div>
					<p class="contact-link">Almaty/Kazakhstan</p>
				</li>
				<li class="contact-item">
					<div class="contact-item-icon"><DiGithubBadge /></div>
					<p class="contact-link">AnoirsGit</p>
				</li>
				<li class="contact-item">
					<div class="contact-item-icon"><IoLogoLinkedin /></div>
					<a href="https://www.linkedin.com/in/anoir-beibit-73218a215/">Anoir Beibit</a>
				</li>
				<li class="contact-item">
					<div class="contact-item-icon"><FaTelegramPlane /></div>
					<p class="contact-link">@NiorBegula</p>
				</li>
			</ul>
		</div>
	</div>
</SectionLayout>
