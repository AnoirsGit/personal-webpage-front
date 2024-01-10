<!-- Button.svelte -->

<script>
	export let type = 'button';
	export let disabled = false;
	export let size = 'default';
	export let length = 'default';
	export let color = 'purple';
	export let href = '#';
	export let onClick;

	const sizes = {
		small: ['px-3', 'py-2'],
		default: ['px-4', 'py-3'],
		big: ['px-6', 'py-4'],
		no: []
	};

	const lengths = { default: ['w-max'], full: ['w-full'] };

	const colors = {
		dark: ['bg-dark', 'hover:opacity-60', 'text-white'],
		transparent: ['text-main-purple', 'hover:text-dark-purple'],
		purple: ['bg-main-purple', 'hover:bg-main-dark-purple', 'text-white']
	};

	const findClasses = (obj, key) => {
		if (obj[key]) return obj[key].join(' ');
		return obj['default'].join(' ');
	};

	const classNames = `${findClasses(lengths, length)} rounded-xl font-normal 
	${findClasses(sizes, size)} ${findClasses(colors, color)}`;

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
