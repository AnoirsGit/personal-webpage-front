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