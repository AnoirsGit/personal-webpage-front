export const getPositionOnGlobeFromCoordinatesDeg = (radius, latitude, longitude) => {
    const radLatitude = (latitude / 180) * Math.PI;
    const radLongitude = (longitude / 180) * Math.PI;

    return {
        x: radius * Math.cos(radLatitude) * Math.sin(radLongitude),
        y: radius * Math.sin(radLatitude),
        z: radius * Math.cos(radLatitude) * Math.cos(radLongitude),
    };
};

export const getPositionOnGlobeFromCoordinates = (radius = 5, latitude, longitude) => {
    const radLatitude = (latitude / 180) * Math.PI;
    const radLongitude = (longitude / 180) * Math.PI;

    return getPositionOnGlobeFromCoordinatesDeg(radius, radLatitude, radLongitude);
};

export const getPositionOnGlobeFromCoordinatesAsArr = (radius = 5, latitude, longitude) => {
    const coords = getPositionOnGlobeFromCoordinates(radius, latitude, longitude);

    return [coords.x, coords.y, coords.z];
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
