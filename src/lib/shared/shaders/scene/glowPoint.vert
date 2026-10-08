// Stars, places and process nodes: a hot core, a soft halo and (for places and nodes) a
// slow ring. Reveal, hover and twinkle are all per point.
uniform float uTime;
uniform float uPixelRatio;
uniform float uPhase;
uniform float uHover;
uniform float uMotion;
uniform float uOnSphere;   // 1: points sit on the globe, fade on the far side
uniform float uMaxPoint;
attribute float aSize;     // core diameter, CSS px
attribute vec2 aWindow;    // reveal window in uPhase units
attribute float aSeed;
attribute float aKind;     // 0 star, 1 place, 2 home, 3 process node
attribute float aIndex;
varying float vReveal;
varying float vKind;
varying float vSeed;
varying float vHover;
varying float vFacing;
varying float vScale;

const float SPRITE = 7.0;  // sprite diameter in core diameters

void main() {
	vec4 mv = modelViewMatrix * vec4(position, 1.0);
	gl_Position = projectionMatrix * mv;
	float reveal = smoothstep(aWindow.x, aWindow.y, uPhase);
	float hover = 1.0 - step(0.5, abs(aIndex - uHover));
	float twinkle = 1.0 + 0.1 * sin(uTime * (1.1 + aSeed * 1.9) + aSeed * 40.0) * uMotion;
	float size = aSize * (0.5 + 0.5 * reveal) * twinkle * (1.0 + hover * 0.35);
	float sprite = min(size * uPixelRatio * SPRITE, uMaxPoint);
	gl_PointSize = sprite;
	vScale = sprite / max(size * uPixelRatio, 1e-3);

	vFacing = 1.0;
	if (uOnSphere > 0.5) {
		vec3 nv = normalize(normalMatrix * normalize(position));
		vFacing = smoothstep(0.02, 0.3, dot(nv, normalize(-mv.xyz)));
	}
	vReveal = reveal;
	vKind = aKind;
	vSeed = aSeed;
	vHover = hover;
}
