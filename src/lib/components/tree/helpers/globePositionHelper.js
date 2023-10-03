export const getCoordinatesOnGlobeRadians = (radius = 5, latitude, longitude) => {
    return {
        x: radius * Math.cos(latitude) * Math.sin(longitude),
        x: radius * Math.sin(longitude),
        z: radius * Math.sin(latitude) * Math.cos(longitude),
    }
}

export const getCoordinatesOnGlobe = (radius = 5, latitude, longitude) => {
    const radLatitude = (latitude / 180) * Math.PI;
    const radLongitude = (longitude / 180) * Math.PI;
    return getCoordinatesOnGlobe(radius, radLatitude, radLongitude)
}