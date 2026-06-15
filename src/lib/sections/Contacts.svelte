<script>
	import SectionLayout from '$lib/shared/UI/SectionLayout.svelte';
	import Globe from '$lib/widgets/globe/Globe.svelte';
	import Deferred from '$lib/shared/UI/Deferred.svelte';
	import '$lib/app/styles/globe.css';
	import '$lib/app/styles/contacts.css';

	import Icon from '@iconify/svelte';
	import Clipboard from '$lib/shared/UI/Clipboard.svelte';
	import { addMessage } from '$lib/shared/stores/messageStore';

	const onCopy = () => addMessage({ icon: 'fa:copy', text: 'Copied' });
</script>

<SectionLayout title="Contacts" name="contacts">
	<div class="relative globe-wrapper-h contacts-stage">
		<Deferred minHeight="100%" rootMargin="1600px">
			<Globe />
		</Deferred>

		<div class="contacts-panel-wrap">
			<div class="contacts-panel glass-panel gradient-border">
				<div class="contacts-head">
					<p class="contacts-eyebrow">Get in touch</p>
					<h3 class="contacts-title">Let's build something great</h3>
				</div>

				<ul class="contact-list">
					<li class="contact-item">
						<span class="contact-plate"><Icon icon="ic:baseline-email" /></span>
						<Clipboard text="anoirsmail@gmail.com" let:copy on:copy={() => onCopy()}>
							<button class="contact-body" on:click={copy}>
								<span class="contact-label">Email</span>
								<span class="contact-value">anoirsmail@gmail.com</span>
							</button>
						</Clipboard>
						<Icon class="contact-action" icon="mingcute:copy-2-line" />
					</li>

					<li class="contact-item">
						<span class="contact-plate"><Icon icon="material-symbols:call" /></span>
						<Clipboard text="87079116992" let:copy on:copy={() => onCopy()}>
							<button class="contact-body" on:click={copy}>
								<span class="contact-label">Phone</span>
								<span class="contact-value">+8 (707) 911-69-92</span>
							</button>
						</Clipboard>
						<Icon class="contact-action" icon="mingcute:copy-2-line" />
					</li>

					<li class="contact-item">
						<span class="contact-plate"><Icon icon="gridicons:location" /></span>
						<a
							class="contact-body"
							href="http://www.google.com/search?q=almaty+kazakhstan"
							target="_blank"
							rel="noreferrer"
						>
							<span class="contact-label">Location</span>
							<span class="contact-value">Almaty, Kazakhstan</span>
						</a>
						<Icon class="contact-action" icon="mingcute:arrow-right-up-line" />
					</li>

					<li class="contact-item">
						<span class="contact-plate"><Icon icon="mdi:github" /></span>
						<a class="contact-body" href="https://github.com/AnoirsGit" target="_blank" rel="noreferrer">
							<span class="contact-label">GitHub</span>
							<span class="contact-value">AnoirsGit</span>
						</a>
						<Icon class="contact-action" icon="mingcute:arrow-right-up-line" />
					</li>

					<li class="contact-item">
						<span class="contact-plate"><Icon icon="mdi:linkedin" /></span>
						<a
							class="contact-body"
							href="https://www.linkedin.com/in/anoir-beibit-73218a215/"
							target="_blank"
							rel="noreferrer"
						>
							<span class="contact-label">LinkedIn</span>
							<span class="contact-value">Anoir Beibit</span>
						</a>
						<Icon class="contact-action" icon="mingcute:arrow-right-up-line" />
					</li>

					<li class="contact-item">
						<span class="contact-plate"><Icon icon="basil:telegram-solid" /></span>
						<Clipboard text="@NiorBegula" let:copy on:copy={() => onCopy()}>
							<button class="contact-body" on:click={copy}>
								<span class="contact-label">Telegram</span>
								<span class="contact-value">@NiorBegula</span>
							</button>
						</Clipboard>
						<Icon class="contact-action" icon="mingcute:copy-2-line" />
					</li>
				</ul>

				<div class="contacts-time">
					<Icon icon="wi:time-5" />
					<span>Asia / Almaty · UTC+5</span>
				</div>
			</div>
		</div>
	</div>
</SectionLayout>
