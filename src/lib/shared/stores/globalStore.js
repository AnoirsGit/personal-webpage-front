import { writable } from 'svelte/store';

export const isLoaded = writable(false);
export const isCloseLoader = writable(false);

export const deviceWidth = writable(1600);

export const onLoaded = () => {
    isLoaded.set(true)
    setTimeout(() => isCloseLoader.set(true), 500)
}
