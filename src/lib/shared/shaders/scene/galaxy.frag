// Bakes the Milky Way once into an equirectangular map (see parts/Sky.svelte). The channels
// are densities, not colours, so the sky shader colours them from the palette:
//   r — the band's diffuse light: mottled star clouds, torn by dark dust lanes and the rift
//       along its middle
//   g — the core: a warm swelling of the band around the galactic centre
//   b — faint rose knots of glowing gas strung along the band
// The band follows the great circle with normal uNormal; uCore lies on it (scene/galaxy.js).
// The field has detail finer than a texel (the dust lanes, the edges of the clouds): one
// sample per texel broke it into stair steps that the magnified map showed as facets, so every
// texel averages SAMPLES × SAMPLES samples spread over its area.
uniform vec3 uNormal;
uniform vec3 uCore;
uniform vec2 uTexel; // one texel of the map, in uv
varying vec2 vUv;

float hash(vec3 p) {
	p = fract(p * 0.3183099 + 0.1);
	p *= 17.0;
	return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 x) {
	vec3 i = floor(x);
	vec3 f = fract(x);
	f = f * f * (3.0 - 2.0 * f);
	return mix(
		mix(mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
			mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
		mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
			mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
		f.z
	);
}

float fbm(vec3 p) {
	float value = 0.0;
	float amplitude = 0.5;
	for (int i = 0; i < 5; i++) {
		value += amplitude * noise(p);
		p = p * 2.07 + vec3(1.7, 9.2, 3.1);
		amplitude *= 0.5;
	}
	return value;
}

vec3 galaxy(vec2 uv) {
	float lon = (uv.x - 0.5) * 6.2831853;
	float lat = (uv.y - 0.5) * 3.1415927;
	vec3 d = vec3(cos(lat) * sin(lon), sin(lat), cos(lat) * cos(lon));

	// galactic coordinates: b across the band, l along it from the core (radians)
	vec3 n = normalize(uNormal);
	vec3 c = normalize(uCore - n * dot(uCore, n));
	vec3 e = cross(n, c);
	float b = asin(clamp(dot(d, n), -1.0, 1.0));
	float l = atan(dot(d, e), dot(d, c));
	float nearCore = exp(-l * l / 0.32);

	// the band wanders a little and swells towards the core
	vec3 along = vec3(cos(l), sin(l), 0.0) * 2.2;
	float centre = 0.05 * (fbm(along + vec3(7.0, 1.0, 3.0)) - 0.5);
	float width = 0.085 + 0.05 * fbm(along + vec3(2.0, 8.0, 5.0)) + 0.1 * nearCore;
	float y = b - centre;
	float profile = exp(-y * y / (2.0 * width * width));
	float halo = exp(-y * y / (2.0 * width * width * 7.0));
	// far off the band only its wide halo is left (the rest is below 1/1000): no noise there
	if (abs(y) > 4.5 * width) return vec3(0.22 * halo, 0.0, 0.0);

	// mottled star clouds, folded once so they read as clouds and not as noise
	vec3 p = d * 3.2;
	float warp = fbm(p * 0.9 + vec3(3.0, 1.0, 7.0));
	float clouds = fbm(p * 2.3 + 1.6 * warp);
	float light = profile * (0.35 + 1.1 * smoothstep(0.38, 0.78, clouds)) + 0.22 * halo;

	// dust: a rift along the middle that comes and goes, and thin lanes torn across it
	float tear = fbm(p * 5.0 + 3.0 * warp);
	float across = (y + 0.012) / (0.3 * width); // signed: no pow() here, it is undefined below 0
	float rift = exp(-across * across) * smoothstep(0.32, 0.6, fbm(p * 1.7 + 4.0));
	float lanes = smoothstep(0.66, 0.8, 1.0 - abs(2.0 * fbm(p * 3.1 + 2.0 * warp) - 1.0));
	float dust = clamp((0.95 * rift + 0.75 * lanes * profile) * smoothstep(0.25, 0.55, tear), 0.0, 0.94);

	float coreWidth = width * 1.25;
	float core = nearCore * exp(-y * y / (2.0 * coreWidth * coreWidth)) * (0.6 + 0.6 * clouds);
	float knots = smoothstep(0.66, 0.86, fbm(p * 4.2 + vec3(9.0, 2.0, 4.0))) * profile;

	return vec3(
		clamp(light * (1.0 - dust), 0.0, 1.0),
		clamp(core * (1.0 - 0.75 * dust), 0.0, 1.0),
		clamp(knots * (1.0 - dust), 0.0, 1.0)
	);
}

void main() {
	vec3 sum = vec3(0.0);
	for (int i = 0; i < SAMPLES; i++) {
		for (int j = 0; j < SAMPLES; j++) {
			vec2 offset = (vec2(float(i), float(j)) + 0.5) / float(SAMPLES) - 0.5;
			sum += galaxy(vUv + offset * uTexel);
		}
	}
	gl_FragColor = vec4(sum / float(SAMPLES * SAMPLES), 1.0);
}
