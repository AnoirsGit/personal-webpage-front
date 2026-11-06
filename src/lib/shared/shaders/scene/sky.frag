// Deep space: the base colour and the Milky Way baked by parts/Sky.svelte (galaxy.frag),
// dithered against banding. The band hangs at a finite distance, so it shifts a little
// against the stars as the camera travels; it drifts very slowly while motion is allowed,
// and opens soft clearings behind readable page content.
uniform vec3 uBase;
uniform float uDim;
uniform float uTime;
uniform float uMotion;
uniform sampler2D uGalaxy;
uniform vec2 uGalaxySize;
uniform float uGalaxyMix;
uniform vec3 uGlow;
uniform vec3 uCore;
uniform vec3 uRose;
uniform vec3 uCamera;
uniform float uPixelRatio;
uniform float uGrain;
varying vec3 vDir;

const float GALAXY_DISTANCE = 300.0;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// the content mask taken wide and soft: text sits in gentle clearings of the band, with no
// edge to see (the bright parts use the sharp contentShade())
float clearing() {
	vec2 uv = gl_FragCoord.xy / uViewport;
#ifdef LOW
	// phones: one tap (the mask is small and filtered, its edge is soft enough)
	float mask = texture2D(uOcclusion, uv).r;
#else
	vec2 r = 52.0 * uPixelRatio / uViewport;
	float mask = texture2D(uOcclusion, uv).r * 0.36 +
		(texture2D(uOcclusion, uv + vec2(r.x, r.y)).r + texture2D(uOcclusion, uv + vec2(-r.x, r.y)).r +
		texture2D(uOcclusion, uv + vec2(r.x, -r.y)).r + texture2D(uOcclusion, uv - r).r) * 0.16;
#endif
	return 1.0 - 0.7 * mask;
}

// The band's countless faint stars, too many to be points: one chance of a star per cell of
// a fine grid on the sky (≈3 px across on a laptop), taken where the band is dense and fixed
// to the sky, so they travel with it instead of swimming on the screen.
float starDust(vec3 n, float crowd) {
	vec3 p = n * 420.0;
	vec3 cell = floor(p);
	float seed = fract(sin(dot(cell, vec3(127.1, 311.7, 74.7))) * 43758.5453);
	if (seed > crowd) return 0.0;
	vec3 h = fract(vec3(seed * 13.71, seed * 71.37, seed * 157.13));
	vec3 toStar = cell + 0.3 + 0.4 * h - p;
	float across = length(toStar - n * dot(toStar, n));
	// a small hard point, not a soft blob: sand is what a blurry crowd of them looks like
	return smoothstep(0.2, 0.06, across) * (0.35 + 0.9 * h.y * h.y);
}

vec2 equirect(vec3 d) {
	return vec2(atan(d.x, d.z) / 6.2831853 + 0.5, asin(clamp(d.y, -1.0, 1.0)) / 3.1415927 + 0.5);
}

// The map is magnified several times on screen, and a bilinear read of it is flat inside each
// texel with a crease at every border — the clouds looked faceted. A cubic B-spline is smooth
// across the borders; it costs four bilinear reads (GPU Gems 2, ch. 20).
vec3 galaxyAt(vec2 uv) {
	vec2 st = uv * uGalaxySize - 0.5;
	vec2 i = floor(st);
	vec2 f = st - i;
	vec2 f2 = f * f;
	vec2 f3 = f2 * f;
	vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0;
	vec2 w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0;
	vec2 w2 = (1.0 + 3.0 * f + 3.0 * f2 - 3.0 * f3) / 6.0;
	vec2 w3 = f3 / 6.0;
	vec2 g0 = w0 + w1;
	vec2 g1 = w2 + w3;
	vec2 p0 = (i - 0.5 + w1 / g0) / uGalaxySize;
	vec2 p1 = (i + 1.5 + w3 / g1) / uGalaxySize;
	return g0.y * (g0.x * texture2D(uGalaxy, p0).rgb + g1.x * texture2D(uGalaxy, vec2(p1.x, p0.y)).rgb) +
		g1.y * (g0.x * texture2D(uGalaxy, vec2(p0.x, p1.y)).rgb + g1.x * texture2D(uGalaxy, p1).rgb);
}

void main() {
	vec3 d = normalize(vDir);
	vec3 color = uBase;

	if (uGalaxyMix > 0.0) {
		vec3 n = normalize(d * GALAXY_DISTANCE + uCamera);
		float yaw = uTime * uMotion * 0.0025;
		n = vec3(n.x * cos(yaw) - n.z * sin(yaw), n.y, n.x * sin(yaw) + n.z * cos(yaw));
		vec3 density = galaxyAt(equirect(n));
		vec3 galaxy = uGlow * density.r + uCore * density.g + uRose * density.b;
		// the band's faint stars, only where it is (most of the sky skips the work)
		float crowd = uGrain * clamp(0.26 * density.r + 0.2 * density.g, 0.0, 0.36);
		if (crowd > 0.012) galaxy += vec3(0.44, 0.44, 0.52) * starDust(n, crowd) * (0.4 + 0.6 * density.r);
		color += galaxy * uGalaxyMix * clearing();
	}

	color *= uDim;
	color += (hash(gl_FragCoord.xy) - 0.5) * (2.0 / 255.0);
	gl_FragColor = vec4(color, 1.0);
}
