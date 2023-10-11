export const getPositionOnGlobeFromCoordinates = (radius, latitude, longitude, isIndeg = true) => {
    if (isIndeg) {
        latitude = (latitude / 180) * Math.PI;
        longitude = (longitude / 180) * Math.PI;
    }
    return [
        radius * Math.cos(latitude) * Math.sin(longitude),
        radius * Math.sin(latitude),
        radius * Math.cos(latitude) * Math.cos(longitude),
    ]
};

export const mapArrayOfCoordinatesToPosition = (arrOfCoordinates, radius) => {
    return arrOfCoordinates.map(coordinates => {
        const radLatitude = (coordinates.latitude / 180) * Math.PI;
        const radLongitude = (coordinates.longitude / 180) * Math.PI;
        return [
            radius * Math.cos(radLatitude) * Math.sin(radLongitude),
            radius * Math.sin(radLatitude),
            radius * Math.cos(radLatitude) * Math.cos(radLongitude),
        ];
    });
};

export const pixelsArrayToCoordinates = (width, height, pixels,) => {
    const margin = 8
    // Geographic coordinates of map corners (approximate values)
    const topLeftLongitude = -180; // Longitude of the top-left corner of the map
    const topLeftLatitude = 90 - margin; // Latitude of the top-left corner of the map with margin
    const bottomRightLongitude = 180; // Longitude of the bottom-right corner of the map
    const bottomRightLatitude = -90 + margin; // Latitude of the bottom-right corner of the map with margin

    const coordinatesArray = [];

    // Convert pixels to coordinates and check alpha values
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixelIndex = (y * width + x) * 4; // Get the pixel index

            const alpha = pixels[pixelIndex + 3]; // Get the alpha channel value of the pixel

            // Check the alpha value
            if (alpha > 100) {
                // Convert pixel color to longitude and latitude
                const longitude =
                    topLeftLongitude + (x / width) * (bottomRightLongitude - topLeftLongitude);
                const latitude =
                    topLeftLatitude - (y / height) * (topLeftLatitude - bottomRightLatitude);

                coordinatesArray.push({ latitude, longitude }); // Add the coordinate to the array
            }
        }
    }
    return coordinatesArray;
}