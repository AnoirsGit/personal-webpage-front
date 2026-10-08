<!-- Kicker, the section's one H2 (with its italic accent) and a lead paragraph. -->
<script>
	/** id of the H2, for the section's aria-labelledby */
	export let id;
	export let index = '';
	export let kicker;
	export let titleLead;
	export let titleAccent = '';
	export let lead = '';
</script>

<header class="section-head">
	<p class="kicker">
		{#if index}<span class="kicker-index">{index}</span>{/if}
		{kicker}
	</p>
	<h2 class="section-title" {id}>
		{titleLead}
		{#if titleAccent}<span class="accent">{titleAccent}</span>{/if}
	</h2>
	{#if lead}<p class="section-lead">{lead}</p>{/if}
	<slot />
</header>

<style>
	.kicker-index {
		color: var(--text-faint);
		font-variant-numeric: tabular-nums;
	}
</style>
