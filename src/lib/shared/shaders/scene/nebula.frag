// Bakes the nebulae once into an equirectangular density map (see parts/Sky.svelte): domain-
// warped fbm on the sphere, gathered into a few large soft clouds. Channels are densities,
// not colours — r: violet clouds, g: indigo clouds, b: the faint warm dust — so the sky
// shader colours them from the palette and can drift them without re-baking.
uniform vec3 uCloudA; // violet, the skills sky (both layouts)
uniform vec3 uCloudB; // indigo, right of the skills sky and behind the process graph
uniform vec3 uCloudC; // warm dust low behind the Earth
uniform vec3 uCloudD; // violet veil behind the hero and the low-orbit sections
uniform vec3 uCloudE; // indigo overhead, where the phone layout's camera climbs
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
	for (int i = 0; i < 6; i++) {
		value += amplitude * noise(p);
		p = p * 2.03 + vec3(1.7, 9.2, 3.1);
		amplitude *= 0.5;
	}
	return value;
}

// soft cap around a direction: 1 at the centre, 0 past `radius` (radians)
float cloud(vec3 d, vec3 centre, float radius) {
	float angle = acos(clamp(dot(d, normalize(centre)), -1.0, 1.0));
	return 1.0 - smoothstep(radius * 0.25, radius, angle);
}

void main() {
	float lon = (vUv.x - 0.5) * 6.2831853;
	float lat = (vUv.y - 0.5) * 3.1415927;
	vec3 d = vec3(cos(lat) * sin(lon), sin(lat), cos(lat) * cos(lon));

	// domain warping: the field folds into itself, which reads as gas rather than noise
	vec3 p = d * 2.6;
	vec3 q = vec3(fbm(p + vec3(0.0, 0.0, 0.0)), fbm(p + vec3(5.2, 1.3, 2.8)), fbm(p + vec3(1.7, 9.2, 4.1)));
	vec3 r = vec3(fbm(p + 3.5 * q + vec3(8.3, 2.8, 1.1)), fbm(p + 3.5 * q + vec3(2.1, 6.7, 7.4)), 0.0);
	float gas = fbm(p + 3.0 * r.xyy);
	// thin bright filaments where the warped field folds
	float filaments = pow(1.0 - abs(2.0 * fbm(p * 1.8 + 2.0 * q) - 1.0), 6.0);
	// dark dust lanes cut through the clouds
	float lanes = smoothstep(0.42, 0.62, fbm(p * 1.3 + 4.0 * r.yxy));

	float body = smoothstep(0.27, 0.8, gas);
	float detail = body * (0.75 + 0.6 * filaments) * (1.0 - 0.55 * lanes);

	float a = cloud(d, uCloudA, 0.85) + 0.8 * cloud(d, uCloudD, 0.9);
	float b = cloud(d, uCloudB, 0.85) + 0.9 * cloud(d, uCloudE, 0.6);
	float c = cloud(d, uCloudC, 0.5);

	gl_FragColor = vec4(
		clamp(detail * a, 0.0, 1.0),
		clamp(detail * b, 0.0, 1.0),
		clamp((0.35 * body + filaments * body) * c, 0.0, 1.0),
		1.0
	);
}
