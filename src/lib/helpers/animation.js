// Easing functions
const func = {
    ease: {
        in: t => t,
        out: t => 1 - t,
        inOut: t => (t < 0.5 ? 2 * t : 2 * (1 - t)),
        // Add other easing functions here
    },
    back: {
        in: t => t * t * (2.70158 * t - 1.70158),
        out: t => 1 - func.back.in(1 - t),
        inOut: t => (t < 0.5 ? 0.5 * func.back.in(2 * t) : 0.5 * func.back.out(2 * t - 1) + 0.5),
        // Add other back easing functions here
    },
};

// Add other easing functions as needed
export const requestAnimationTween = (startValue, endValue, duration, repeatDuration, type = 'ease.in') => {
    const funcType = type.split('.');
    const easingFunction = func[funcType[0]]?.[funcType[1]];

    let startTime = new Date().getTime();

    if (isNaN(startValue) || isNaN(endValue) || isNaN(duration) || isNaN(repeatDuration) || !easingFunction) {
        console.error("Invalid parameters for tween");
        return;
    }

    const reset = () => {
        startTime = new Date().getTime();
    };

    const update = () => {
        const currentTime = new Date().getTime();
        const timeDifference = currentTime - startTime;

        const totalElapsedTime = timeDifference % (duration + repeatDuration);

        if (totalElapsedTime <= duration) {
            const progress = easingFunction(totalElapsedTime / duration);
            return startValue + (endValue - startValue) * progress;
        }

        return endValue;
    };

    return {
        reset,
        update,
    };
};
