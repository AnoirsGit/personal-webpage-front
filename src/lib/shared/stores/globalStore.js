import { writable } from 'svelte/store';

export const isLoaded = writable(false);
export const isCloseLoader = writable(false);
export const deviceWidth = writable(1600);

/*
 * Loader lifecycle: only the hero ("aboutMe") gates the intro loader —
 * everything below the fold mounts lazily when scrolled into view.
 * The loader is shown at least MIN_LOADER_MS so the intro doesn't blink,
 * and is force-closed after MAX_LOADER_MS so a stalled asset can't trap the user.
 */
const MIN_LOADER_MS = 1200;
const MAX_LOADER_MS = 6000;

let loaderShownAt = 0;
let fallbackId;
let closed = false;

const closeLoader = () => {
    if (closed) return;
    closed = true;
    clearTimeout(fallbackId);
    isLoaded.set(true);
    isCloseLoader.set(true);
};

export const startLoader = () => {
    loaderShownAt = performance.now();
    fallbackId = setTimeout(closeLoader, MAX_LOADER_MS);
};

export const onLoaded = (sectionName) => {
    if (sectionName !== 'aboutMe' || closed) return;

    const elapsed = performance.now() - loaderShownAt;
    setTimeout(closeLoader, Math.max(MIN_LOADER_MS - elapsed, 0));
};
