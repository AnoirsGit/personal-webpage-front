<script>
	import SectionLayout from '$lib/shared/UI/SectionLayout.svelte';
	import Globe from '$lib/widgets/globe/Globe.svelte';
	import '$lib/app/styles/globe.css';
	import '$lib/app/styles/contacts.css';

	import Icon from '@iconify/svelte';
	import Clipboard from '$lib/shared/UI/Clipboard.svelte';
	import { addMessage } from '$lib/shared/stores/messageStore';

	const onCopy = () => addMessage({ icon: 'fa:copy', text: 'Copied' });
</script>

<SectionLayout title="Contacts" name="contacts">
	<div class="relative globe-wrapper-h">
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
						<Clipboard text="anoirsmail@gmail.com" let:copy on:copy={() => onCopy()}>
							<button on:click={copy} class="contact-link">anoirsmail@gmail.com</button>
						</Clipboard>
					</li>

					<li class="contact-item">
						<Icon class="text-3xl" icon="material-symbols:call" />
						<Clipboard text="87079116992" let:copy on:copy={() => onCopy()}>
							<button on:click={copy} class="contact-link">+ 8 (707)-911-69-92</button>
						</Clipboard>
					</li>
					<li class="contact-item">
						<Icon class="text-3xl" icon="gridicons:location" />
						<a
							href="http://www.google.com/search?q=almaty+kazakhstan"
							target="_blank"
							class="contact-link">Almaty/Kazakhstan</a
						>
					</li>
					<li class="contact-item">
						<Icon class="text-3xl" icon="mdi:github" />
						<a href="https://github.com/AnoirsGit" target="_blank" class="contact-link">AnoirsGit</a
						>
					</li>
					<li class="contact-item">
						<Icon class="text-3xl" icon="mdi:linkedin" />
						<a href="https://www.linkedin.com/in/anoir-beibit-73218a215/" target="_blank">
							Anoir Beibit
						</a>
					</li>
					<li class="contact-item">
						<Icon class="text-3xl" icon="basil:telegram-solid" />
						<Clipboard text="@NiorBegula" let:copy on:copy={() => onCopy()}>
							<button on:click={copy} class="contact-link">@NiorBegula</button>
						</Clipboard>
					</li>
				</ul>
			</div>
		</div>
	</div>
</SectionLayout>
