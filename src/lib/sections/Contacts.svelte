<script>
	import SectionLayout from '$lib/shared/UI/SectionLayout.svelte';
	import Globe from '$lib/widgets/globe/Globe.svelte';
	import '$lib/app/styles/globe.css';
	import '$lib/app/styles/contacts.css';

	import Icon from '@iconify/svelte';
</script>

<SectionLayout title="Contacts">
	<Globe />
	<div class="absolute flex items-center gap-1 right-24">
		<Icon class="text-2xl" icon="wi:time-5" />
		<p class="text-sm lg:text-base pt-1">Asia / Almaty ( UTC+5 )</p>
	</div>
	<div class="flex">
		<div class="contacts">
			<ul class="contact-list">
				<li class="contact-item">
					<Icon class="text-3xl" icon="ic:baseline-email" />
					<p class="contact-link">anoirsmail@gmail.com</p>
				</li>

				<li class="contact-item">
					<Icon class="text-3xl" icon="material-symbols:call" />
					<p class="contact-link">+ 8 (707)-911-69-92</p>
				</li>
				<li class="contact-item">
					<Icon class="text-3xl" icon="gridicons:location" />
					<p class="contact-link">Almaty/Kazakhstan</p>
				</li>
				<li class="contact-item">
					<Icon class="text-3xl" icon="mdi:github" />
					<p class="contact-link">AnoirsGit</p>
				</li>
				<li class="contact-item">
					<Icon class="text-3xl" icon="mdi:linkedin" />
					<a href="https://www.linkedin.com/in/anoir-beibit-73218a215/">Anoir Beibit</a>
				</li>
				<li class="contact-item">
					<Icon class="text-3xl" icon="basil:telegram-solid" />
					<p class="contact-link">@NiorBegula</p>
				</li>
			</ul>
		</div>
	</div>
</SectionLayout>
