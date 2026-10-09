// Deep space: the base colour, a dim galactic band and the nebulae baked by parts/Sky.svelte
// (nebula.frag), dithered against banding. The clouds hang at a finite distance, so they shift
// a little against the stars as the camera travels; they drift slowly while motion is
// allowed, and dim behind readable page content like every other bright part.
uniform vec3 uBase;
uniform vec3 uBandNormal;
uniform float uDim;
uniform float uTime;
uniform float uMotion;
uniform sampler2D uNebula;
uniform float uNebulaMix;
uniform vec3 uViolet;
uniform vec3 uIndigo;
uniform vec3 uWarm;
uniform vec3 uCamera;
uniform float uPixelRatio;
varying vec3 vDir;

const float NEBULA_DISTANCE = 300.0;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// the content mask taken wide and soft: text sits in gentle clearings of the clouds, with no
// edge to see (the bright parts use the sharp contentShade())
float clearing() {
	vec2 uv = gl_FragCoord.xy / uViewport;
	vec2 r = 52.0 * uPixelRatio / uViewport;
	float mask = texture2D(uOcclusion, uv).r * 0.36 +
		(texture2D(uOcclusion, uv + vec2(r.x, r.y)).r + texture2D(uOcclusion, uv + vec2(-r.x, r.y)).r +
		texture2D(uOcclusion, uv + vec2(r.x, -r.y)).r + texture2D(uOcclusion, uv - r).r) * 0.16;
	return 1.0 - 0.85 * mask;
}

vec2 equirect(vec3 d) {
	return vec2(atan(d.x, d.z) / 6.2831853 + 0.5, asin(clamp(d.y, -1.0, 1.0)) / 3.1415927 + 0.5);
}

void main() {
	vec3 d = normalize(vDir);
	vec3 color = uBase;
	float band = 1.0 - abs(dot(d, uBandNormal));
	color += vec3(0.09, 0.075, 0.15) * pow(band, 12.0) * 0.55;

	if (uNebulaMix > 0.0) {
		vec3 n = normalize(d * NEBULA_DISTANCE + uCamera);
		float t = uTime * uMotion;
		float yaw = t * 0.0035;
		n = vec3(n.x * cos(yaw) - n.z * sin(yaw), n.y, n.x * sin(yaw) + n.z * cos(yaw));
		n = normalize(n + 0.016 * vec3(
			sin(t * 0.05 + n.y * 4.0),
			sin(t * 0.041 + n.z * 4.0),
			sin(t * 0.063 + n.x * 4.0)
		));
		vec3 density = texture2D(uNebula, equirect(n)).rgb;
		vec3 nebula = uViolet * density.r + uIndigo * density.g + uWarm * density.b;
		color += nebula * uNebulaMix * clearing();
	}

	color *= uDim;
	color += (hash(gl_FragCoord.xy) - 0.5) * (2.0 / 255.0);
	gl_FragColor = vec4(color, 1.0);
}
