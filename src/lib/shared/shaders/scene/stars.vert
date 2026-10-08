// Distant stars: fixed pixel size (no attenuation), gentle twinkle.
uniform float uTime;
uniform float uPixelRatio;
uniform float uIntro;
uniform float uDim;
attribute float aSize;
attribute vec3 aColor;
attribute vec2 aTwinkle;
varying vec3 vColor;
varying float vAlpha;

void main() {
	vec4 mv = modelViewMatrix * vec4(position, 1.0);
	gl_Position = projectionMatrix * mv;
	float twinkle = 0.78 + 0.22 * sin(uTime * aTwinkle.x + aTwinkle.y);
	float size = aSize * uPixelRatio;
	// Sub-2px stars keep a 2px footprint and lose brightness instead, so they stay round.
	gl_PointSize = max(size, 2.0);
	vAlpha = twinkle * uIntro * uDim * min(size * size * 0.25, 1.0);
	vColor = aColor;
}
