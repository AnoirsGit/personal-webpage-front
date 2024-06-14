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

export const mixColors = (color1, color2, percent = 50) => {
    // Helper function to convert RGB values to hex string
    const rgbToHex = (r, g, b) => {
        const toHex = (n) => {
            const hex = n.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };

    // Convert both colors to RGB arrays
    const rgb1 = checkAndConvertToRGB(color1);
    const rgb2 = checkAndConvertToRGB(color2);

    // If either color is invalid, return null
    if (!rgb1 || !rgb2) {
        console.error('Invalid color input');
        return null;
    }

    // Ensure percent is within range [0, 100]
    percent = Math.min(100, Math.max(0, percent));

    // Calculate the mixing ratio based on percent
    const ratio = 1 - percent / 100;

    // Mix the RGB values using the weighted average
    const mixedRGB = [
        Math.round(rgb1[0] * ratio + rgb2[0] * (1 - ratio)),
        Math.round(rgb1[1] * ratio + rgb2[1] * (1 - ratio)),
        Math.round(rgb1[2] * ratio + rgb2[2] * (1 - ratio)),
    ];

    // Convert the mixed RGB values to a hex color
    return rgbToHex(mixedRGB[0], mixedRGB[1], mixedRGB[2]);
};
