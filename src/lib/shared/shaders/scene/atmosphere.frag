// Back faces of a shell around the planet: brightest at the limb, fading outward.
uniform vec3 uColor;
uniform vec3 uLightDir;
uniform float uLimb;     // sqrt(1 - (R / Ratmosphere)^2): |n·v| at the planet's limb
uniform float uStrength;
uniform float uDim;
uniform float uIntro;
varying vec3 vNormalW;
varying vec3 vPosW;

void main() {
	vec3 n = normalize(vNormalW);
	vec3 v = normalize(cameraPosition - vPosW);
	float x = clamp(-dot(n, v) / uLimb, 0.0, 1.0);
	float glow = pow(x, 3.4) * 0.75 + pow(x, 12.0) * 0.55;
	float light = clamp(dot(normalize(vPosW), uLightDir) * 0.5 + 0.5, 0.0, 1.0);
	vec3 color = uColor * glow * uStrength * (0.35 + 0.9 * light);
	gl_FragColor = vec4(color * uDim * uIntro * contentShade(), 1.0);
}
