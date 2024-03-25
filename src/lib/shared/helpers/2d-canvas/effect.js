import { Particle,StarParticle } from './particle';

export const createEffect = (ctx, canvas, image) => {
    const particles = [];
    let mouse = { r: 1000, x: null, y: null };

    const init = () => {
        const centerImageX = (canvas.width - image.width) / 2;
        const centerImageY = (canvas.height - image.height) / 2;
        ctx.drawImage(image, centerImageX, centerImageY);
        const { data: pixels } = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const gap = 2;
        const groupPixel = 4;

        for (let y = 0; y < image.height; y += gap * groupPixel) {
            for (let x = 0; x < image.width; x += gap * groupPixel) {
                const index = (y * image.width + x) * groupPixel;
                const [red, green, blue, alpha] = pixels.slice(index, index + 4);
                const color = `rgba(${red},${green},${blue})`;
                const particle = { x, y, color };
                if (alpha > 0)
                    particles.push(Particle({ canvas, ctx, particle, groupSize: gap * groupPixel, mouse }));
            }
        }
    };

    const draw = () => {
        particles.forEach((particle) => particle.draw());
    };

    const update = () => {
        particles.forEach((particle) => particle.update());
    };

    const mouseMoveHandler = (mouseX, mouseY) => {
        mouse.x = mouseX;
        mouse.y = mouseY;
    };

    const mouseLeaveHandler = () => {
        mouse.x = null;
        mouse.y = null;
    };

    return { draw, update, init, mouseLeaveHandler, mouseMoveHandler };
};

export const createStarEffect = ({ ctx, canvas, density = 1 / 2500 }) => {
    const particles = [];
    const particleCount = Math.floor(canvas.width * canvas.height * density);
    let connected = [];
    let mouse = { r: 200 , x: null, y: null };

    const init = () => {
        for (let i = 0; i < particleCount; i++) {
            particles.push(StarParticle({ id: i, canvas, ctx }));
        }
    };

    const sortParticles = () => particles.sort((a, b) => {
        if (a.y === b.y) return a.x - b.x;
        return a.y - b.y;
    });

    const calculateActiveHoveredParticles = () => {
        const tempConnected = []
        for (const { id, getCoordinates, getOpacityAndSize, onShine, unShine} of particles) {
            const {x, y} = getCoordinates()
            const {opacity, size } = getOpacityAndSize()
            
            if(y < mouse.y + mouse.r && y < mouse.y + mouse.r) {
                const distance = Math.sqrt((mouse.y - y) ** 2 + (mouse.x - x) ** 2);
                if (distance <= mouse.r) {
                    tempConnected.push({id, x, y, opacity, size})                 
                    onShine();
                }
                else unShine()
                
            }
        }
        connected = tempConnected;
    }

    const connect = () => {
        for (const connA of connected) {
            for (const connB of connected) {
                const distance = Math.sqrt((connA.y - connB.y) ** 2 + (connA.x - connB.x) ** 2)
                if(distance < 100) {
                    if( connA.id === connB.id) continue
                    const opacity = (Math.min(connA.opacity, connB.opacity)) * 0.8
                    const width = Math.min(connA.size, connB.size) * 0.7
                    ctx.strokeStyle =`rgba(255,255,255,${opacity}`
                    ctx.lineWidth = width;
                    ctx.beginPath();
                    ctx.moveTo(connA.x, connA.y);
                    ctx.lineTo(connB.x, connB.y);
                    ctx.stroke();
                }
            }
        }
    }

    const draw = () => {
        particles.forEach((particle) => particle.draw())
        connect()
        sortParticles()
    };

    const update = () => {
        calculateActiveHoveredParticles()
        particles.forEach((particle) => particle.update())
        sortParticles()
    };

   const mouseMoveHandler = (mouseX, mouseY) => {
        mouse.x = mouseX;
        mouse.y = mouseY;
    };

    const mouseLeaveHandler = () => {
        mouse.x = null;
        mouse.y = null;
    };

    return { init, draw, update, mouseMoveHandler, mouseLeaveHandler };
};


export const animate = ({ctx, canvas, effect}) => {
    if (!canvas) {
        requestAnimationFrame(() => animate({ctx, canvas, effect}));
        return
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    effect.draw();
    effect.update();
    requestAnimationFrame(() => animate({ctx, canvas, effect}));
};