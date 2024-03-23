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
    console.log(particleCount)
    let mouse = { r: 1000, x: null, y: null };

    const init = () => {
        for (let i = 0; i < particleCount; i++) {
            particles.push(StarParticle({ canvas, ctx, mouse }));
        }
    };

    const draw = () => particles.forEach((particle) => particle.draw());
    const update = () => particles.forEach((particle) => particle.update());
    return { init, draw, update };
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