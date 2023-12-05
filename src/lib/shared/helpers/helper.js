export const generateRandomID = (numDigits = 6) => {
    if (numDigits <= 0 || numDigits > 16) {
        throw new Error("Invalid number of digits. Please choose a value between 1 and 16.");
    }

    const min = Math.pow(10, numDigits - 1); // Minimum value for the specified number of digits
    const max = Math.pow(10, numDigits) - 1; // Maximum value for the specified number of digits
    const randomID = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomID.toString(); // Convert to a string
}

export const hexColorToRGB = (colorString) => {
    if (!colorString) return;

    // Remove the '#' character if it exists
    if (colorString[0] === '#') {
        colorString = colorString.substring(1);
    }

    // Check if the input string is a valid hex color
    if (!/^[0-9A-Fa-f]{6}$/.test(colorString)) {
        console.error('Invalid hex color format');
        return;
    }

    // Parse the hex color components
    const r = parseInt(colorString.substring(0, 2), 16);
    const g = parseInt(colorString.substring(2, 4), 16);
    const b = parseInt(colorString.substring(4, 6), 16);

    // Return the RGB values as an object
    return [r, g, b];
};

export const isRGB = (color) => {
    if (
        Array.isArray(color) &&
        color.length === 3 &&
        color.every(component => typeof component === 'number' && component >= 0 && component <= 255)
    ) {
        return color;
    }

    if (typeof color === 'string') {
        const matches = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (matches) {
            const [_, r, g, b] = matches.map(Number);
            if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
                return [r, g, b];
            }
        }
    }

    return false;
};

export const checkAndConvertToRGB = (color) => {
    if (!color) return;

    if (isRGB(color)) return isRGB(color);
    else return hexColorToRGB(color)
}