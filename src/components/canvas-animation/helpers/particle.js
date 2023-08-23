export const Particle = ({ canvas, ctx, particle, groupSize, mouse }) => {
    let [x, y] = [Math.random() * canvas.width, Math.random() * canvas.height];
    let rotationDeg = Math.random() * 360;
    let velocityX = 0;
    let velocityY = 0;
    
    const friction = 0.9;
    const particleSize = groupSize * 3;
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
            const dx = mouse.x - x;
            const dy = mouse.y - y;
            const distance = dx * dx + dy * dy;
            const force = (mouse.r / distance);
            
            if (distance < mouse.r) {
                const angle = Math.atan2(dy, dx);
                velocityX += force * Math.cos(angle);
                velocityY += force * Math.sin(angle);
            }
            x += (velocityX *= friction) + (originX - x) * ease;
            y += (velocityY *= friction) + (originY - y) * ease;
        } else {
            x += (originX - x) * ease;
            y += (originY - y) * ease;
        }

        rotationDeg += rotateVelocity;
    };

    return { draw, drawRect, update };
};
