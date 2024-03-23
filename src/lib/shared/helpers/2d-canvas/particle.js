export const Particle = ({ canvas, ctx, particle, groupSize, mouse }) => {
    let [x, y] = [Math.random() * canvas.width, Math.random() * canvas.height];
    let rotationDeg = Math.random() * 360;
    let velocityX = 0;
    let velocityY = 0;

    const friction = 0.9;
    const particleSize = groupSize * 2.125;
    const size = (particleSize * 0.9) + (Math.random() * particleSize) * 0.9;
    const [originX, originY] = [Math.floor(particle.x), Math.floor(particle.y)];
    const ease = 0.01 + Math.random() * 0.02;

    const rotateVelocity = (Math.random() * 2) - 1;
    const sideLengths = [
        Math.random() * size,
        Math.random() * size,
        Math.random() * size,
    ];

    const draw = () => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotationDeg * Math.PI / 180);

        const centroidY = (sideLengths[0] + sideLengths[2]) / 6;

        ctx.translate(-sideLengths[1] / 2, -centroidY);

        ctx.beginPath();
        ctx.moveTo(0, -sideLengths[0] / 2);
        ctx.lineTo(sideLengths[1] / 2, sideLengths[2] / 2);
        ctx.lineTo(-sideLengths[1] / 2, sideLengths[2] / 2);
        ctx.fillStyle = particle.color;
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    };

    const drawRect = () => {
        ctx.fillStyle = particle.color;
        ctx.fillRect(x, y, size, size);
    };

    const update = () => {
        if (mouse.x && mouse.y) {
            const dx = x - mouse.x;
            const dy = y - mouse.y;
            const distance = dx * dx + dy * dy;
            
            if (distance < mouse.r) { // Apply the effect only within mouse.r
                const angle = Math.atan2(dy, dx);
                const force = (mouse.r ) / mouse.r; // Gradually decrease force with distance
                
                velocityX += force * Math.cos(angle);
                velocityY += force * Math.sin(angle);
            }

            x += (velocityX *= friction) + (originX - x) * ease;
            y += (velocityY *= friction) + (originY - y) * ease;
        } else {
            x += (originX - x) * ease;
            y += (originY - y) * ease;
        }
    
        // Ensure particles stay within canvas bounds
        if (x < canvas.width * 0.1) {
            x = canvas.width * 0.1;
            velocityX *= -1; // Reflect velocity
        } else if (x > canvas.width * 0.9) {
            x = canvas.width * 0.9;
            velocityX *= -1; // Reflect velocity
        }
    
        if (y < canvas.height * 0.1) {
            y = canvas.height * 0.1;
            velocityY *= -1; // Reflect velocity
        } else if (y > canvas.height * 0.9) {
            y = canvas.height * 0.9;
            velocityY *= -1; // Reflect velocity
        }
    
        rotationDeg += rotateVelocity;
    };

    return { draw, drawRect, update };
};


function randomSmoothBySinCurve(x, startDeg) {
    const randomNum = x * Math.random();
    const ratio = randomNum / x;
    const currSinDeg = Math.asin(ratio)
    const radStartDeg = startDeg * Math.PI/180
    const resultSin = radStartDeg + currSinDeg;

    if(Math.random() * 10 * Math.sin(resultSin) < 5) return Math.random * Math.random()
    return randomNum

}

export const StarParticle = ({ canvas, ctx, mouse }) => {
    const size = Math.floor(Math.random() * 2 + 1);
    let x = Math.random() * canvas.width;
    let y = randomSmoothBySinCurve(canvas.height, 30);
    let [velocityX, velocityY] = [Math.random() * 0.5 - 0.25, Math.random() * 0.5 - 0.25];
    let opacity = Math.random() * 0.5 + 0.5;
    let opacityVelocity = 1 / (60 * (Math.random() * 3 + 0.5))

    const draw = () => {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2, false);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + opacity + ')';
        ctx.fill();
    };

    const handleBorderCollision = () => {
        if (x <= 0 || x >= canvas.width) velocityX *= -1;
        if (y <= 0 || y >= canvas.height) velocityY *= -1;
    };

    const handleOpacityCollision = () => {
        if (opacity <= 0 || opacity >= 1) opacityVelocity *= -1;
    };

    const updateParticle = () => {
        x += velocityX;
        y += velocityY;
    };

    const updateOpacity = () => (opacity += opacityVelocity);

    const update = () => {
        if (mouse.x && mouse.y) {
            console.log(mouse);
        }

        handleBorderCollision();
        handleOpacityCollision();
        updateParticle();
        updateOpacity();
    };
    return { update, draw };
};

export const  generateNonEvenlySpacedNumbers = (count, rangeStart, rangeEnd) =>{
    let numbers = [];
    const minDiff = Math.floor((rangeEnd - rangeStart) / count / 2);
    const maxDiff = Math.floor((rangeEnd - rangeStart) / count * 2);
    for (let i = 0; i < count; i++) {
        numbers.push(Math.floor(Math.random() * (rangeEnd - rangeStart + 1)) + rangeStart);
    }
    numbers.sort((a, b) => a - b);

    // Adjust the differences between consecutive numbers
    for (let i = 1; i < numbers.length; i++) {
        let diff = Math.floor(Math.random() * (maxDiff - minDiff + 1)) + minDiff;
        numbers[i] = Math.min(numbers[i], numbers[i - 1] + diff);
    }

    return numbers;
}

