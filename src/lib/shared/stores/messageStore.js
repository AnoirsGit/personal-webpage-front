import { writable } from "svelte/store"; 

export const messageQueue = writable([]);

export const addMessage = (message, timeInSeconds = 7) => {
    writable.push(message)
    setTimeout(() => messageQueue.update( queue => queue.shift()), timeInSeconds * 1000)
}
