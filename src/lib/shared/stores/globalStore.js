import { writable } from 'svelte/store';

export const isLoaded = writable(false);
export const isCloseLoader = writable(false);
export const deviceWidth = writable(1600);

const sections = new Map([
    ['aboutMe', false],
    ['works', false],
    ['contacts', false]
]);

const checkIsSectionsLoaded = () => [...sections.values()].every(Boolean);

const updateLoaded = (sectionName) => {
    if (sections.has(sectionName)) {
        sections.set(sectionName, true);
    }
};

export const onLoaded = (sectionName) => {
    updateLoaded(sectionName);

    if (checkIsSectionsLoaded()) {
        console.log('All sections loaded');
        isLoaded.set(true);
        setTimeout(() => isCloseLoader.set(true), 500);
    }
}