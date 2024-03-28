import { writable } from "svelte/store"; 

export const messageQueue = writable([]);

export const addMessage = (message, timeInSeconds = 7) => {
    messageQueue.update(queue => {
        queue.push(message); // Mutate the existing array by pushing the new message
        setTimeout(() => {
            queue.shift(); // Mutate the existing array by removing the oldest message
            messageQueue.set(queue); // Update the store with the mutated array
        }, timeInSeconds * 1000);
        return queue; // Return the current queue to maintain the reference (although this line is technically redundant in this case)
    });
};
