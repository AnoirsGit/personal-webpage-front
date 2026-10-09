// Distant stars: fixed pixel size (no attenuation), gentle twinkle. The brightest few carry a
// soft halo in a larger sprite — a falloff in the sprite, no post-processing pass — and
// twinkle slower and shallower than the small ones.
uniform float uTime;
uniform float uPixelRatio;
uniform float uIntro;
uniform float uDim;
uniform float uBoost;
attribute float aSize;
attribute vec3 aColor;
attribute vec2 aTwinkle;
attribute float aHalo;
varying vec3 vColor;
varying float vAlpha;
varying float vScale;
varying float vHalo;

void main() {
	vec4 mv = modelViewMatrix * vec4(position, 1.0);
	gl_Position = projectionMatrix * mv;
	float depth = 0.22 - 0.1 * aHalo;
	float twinkle = 1.0 - depth + depth * sin(uTime * aTwinkle.x * (1.0 - 0.5 * aHalo) + aTwinkle.y);
	float size = aSize * uPixelRatio;
	// Sub-2px stars keep a 2px footprint and lose brightness instead, so they stay round.
	float core = max(size, 2.0);
	gl_PointSize = core * (1.0 + 4.0 * aHalo);
	vScale = 1.0 + 4.0 * aHalo;
	vAlpha = twinkle * uIntro * uDim * uBoost * min(size * size * 0.25, 1.0);
	vColor = aColor;
	vHalo = aHalo;
}
