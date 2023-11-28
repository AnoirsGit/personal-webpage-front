import * as Three from 'three';
import { GLOBE_RADIUS } from '$lib/shared/consts/globeConsts';
import { requestAnimationTween } from '$lib/shared/helpers/tween';
import { coordinatesToVector } from '$lib/shared/helpers/tree/globePositionHelper';

export const createImpactGenerator = (useCoordinates) => {
    return ({ lat, lon, x, y, z, shouldRepeat = true } = {}) => {
        const initialImpactRatio = 0;
        const boomSpeed = Math.floor(Math.random() * 1000) + 2000;
        const boomPeriods = shouldRepeat ? Math.floor(Math.random() * 3000) + 3500 : -1;
        const impactMaxRadius = Math.floor(Math.random() * 1) + 2;
        const animationFrame = requestAnimationTween(0, 1, boomSpeed, boomPeriods);

        const impactPosition = useCoordinates
            ? coordinatesToVector(GLOBE_RADIUS, lat, lon)
            : new Three.Vector3(x, y, z);

        return {
            impactPosition,
            initialImpactRatio,
            impactMaxRadius,
            animationFrame,
            shouldRepeat,
            isEmpty: false,
        };
    };
};

export const createEmptyImpacts = n => [...Array(n)].map(() => ({
    isEmpty: true,
    impactPosition: coordinatesToVector(0, 0, 0),
    impactMaxRadius: 0.0,
    impactRatio: 0.0,
}));

export const addImpact = (impacts, impact) => {
    for (let i = 0; i < impacts.length; i++) {
        if (impacts[i].isEmpty) {
            impacts[i] = impact;
            return true;
        }

    }
    return false;
}

export const deleteUnrepeatedImpacts = (impacts) => {
    for (let i = 0; i < impacts.length; i++) {
        if (!impacts[i].shouldRepeat && impacts[i].impactRatio >= 1) {
            impacts[i] = {
                isEmpty: true, impactPosition: coordinatesToVector(0, 0, 0),
                impactMaxRadius: 0.0,
                impactRatio: 0.0,
            };
        }
    }
};

export const updateImpacts = (impacts, stackImpactEvents) => {
    for (let i = 0; i < stackImpactEvents.length; i++) {
        const impact = stackImpactEvents[i];
        addImpact(impacts, impact);
        stackImpactEvents.splice(i, 1);
    }

    impacts.forEach(impact => {
        if (!impact.isEmpty) {
            const updateRatio = impact.animationFrame.update();
            impact.impactRatio = updateRatio;
        }
    });

    deleteUnrepeatedImpacts(impacts);
};

export const calcNewPositionFromRotation = (originalPoint, globeRotation = { x: 0, y: 0, z: 0 }) => {
    const { x, y, z } = originalPoint;
    const { x: globeRotationX, y: globeRotationY, z: globeRotationZ } = globeRotation;

    // Convert rotations to radians
    const thetaX = globeRotationX;
    const thetaY = globeRotationY;
    const thetaZ = globeRotationZ;

    // Rotation around the x-axis
    const newY1 = y * Math.cos(thetaX) - z * Math.sin(thetaX);
    const newZ1 = y * Math.sin(thetaX) + z * Math.cos(thetaX);

    // Rotation around the y-axis
    const newX2 = x * Math.cos(thetaY) - newZ1 * Math.sin(thetaY);
    const newY2 = newY1;
    const newZ2 = x * Math.sin(thetaY) + newZ1 * Math.cos(thetaY);

    // Rotation around the z-axis
    const newX3 = newX2 * Math.cos(thetaZ) + newY2 * Math.sin(thetaZ);
    const newY3 = -newX2 * Math.sin(thetaZ) + newY2 * Math.cos(thetaZ);
    const newZ3 = newZ2;

    return { x: newX3, y: newY3, z: newZ3 };
};
