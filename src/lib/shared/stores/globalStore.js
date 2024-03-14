import { writable } from 'svelte/store';

export const isLoaded = writable(false);

export const onLoaded = () => setTimeout(() => isLoaded.set(true), 500)