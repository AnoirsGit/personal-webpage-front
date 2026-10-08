// Dark planet body: soft key light and a cool fresnel rim. Occludes what is behind it.
uniform vec3 uOcean;
uniform vec3 uRim;
uniform vec3 uLightDir;
uniform float uDim;
uniform float uIntro;
varying vec3 vNormalW;
varying vec3 vPosW;

void main() {
	vec3 n = normalize(vNormalW);
	vec3 v = normalize(cameraPosition - vPosW);
	float facing = clamp(dot(n, v), 0.0, 1.0);
	float fresnel = pow(1.0 - facing, 3.0);
	float light = clamp(dot(n, uLightDir) * 0.5 + 0.5, 0.0, 1.0);
	vec3 color = uOcean * (0.5 + 0.8 * light) + uRim * fresnel * (0.35 + 0.75 * light);
	gl_FragColor = vec4(color * uDim * mix(0.4, 1.0, uIntro), 1.0);
}
