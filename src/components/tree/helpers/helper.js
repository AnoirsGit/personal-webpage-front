export const generateRandomID = (numDigits = 6) => {
    if (numDigits <= 0 || numDigits > 16) {
        throw new Error("Invalid number of digits. Please choose a value between 1 and 16.");
    }

    const min = Math.pow(10, numDigits - 1); // Minimum value for the specified number of digits
    const max = Math.pow(10, numDigits) - 1; // Maximum value for the specified number of digits
    const randomID = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomID.toString(); // Convert to a string
}
