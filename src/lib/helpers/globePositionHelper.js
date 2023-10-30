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

export const mapPositionToArrayOfCoordinates = (positions, radius) => {
    return positions.map(position => {
        const x = position[0];
        const y = position[1];
        const z = position[2];

        const latitude = (Math.asin(y / radius) * 180) / Math.PI;
        const longitude = (Math.atan2(z, x) * 180) / Math.PI;

        return {
            latitude,
            longitude,
        };
    });
};

export function generateSphericalFibonacciMapping(numDots, radius) {
    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
    const coordinatesArray = [];

    for (let i = 0; i < numDots; i++) {
        const y = 1 - (i / (numDots - 1)) * 2; // Ranges from 1 to -1
        const radiusAtY = Math.sqrt(1 - y * y) * radius;
        const theta = 2 * Math.PI * i / phi;

        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;

        coordinatesArray.push([x, y * radius, z]);
    }

    return coordinatesArray;
}