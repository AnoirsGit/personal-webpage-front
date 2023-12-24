<!-- Button.svelte -->

<script>
	export let type = 'button';
	export let disabled = false;
	export let size = 'default';
	export let color = 'purple';
	export let href = '#';
	export let onClick;

	const sizes = {
		small: ['px-3', 'py-2'],
		default: ['px-4', 'py-3'],
		big: ['px-6', 'py-4']
	};

	const colors = {
		dark: ['bg-dark', 'hover:opacity-60', 'text-white'],
		purple: ['bg-main-purple', 'hover:bg-main-dark-purple', 'text-white']
	};

	const findClasses = (obj, key) => {
		if (obj[key]) return obj[key].join(' ');
		return obj['default'].join(' ');
	};

	const classNames = `w-max rounded-xl ${findClasses(sizes, size)} ${findClasses(colors, color)}`;

	function handleClick() {
		if (!disabled && onClick) {
			onClick();
		}
	}
</script>

{#if type === 'link'}
	<a class={classNames} {href} on:click={handleClick} {disabled}>
		<slot />
	</a>
{:else}
	<button class={classNames} on:click={handleClick} {disabled}>
		<slot />
	</button>
{/if}
