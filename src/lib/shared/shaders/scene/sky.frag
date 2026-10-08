// Deep space with two faint nebulae and a dim galactic band, dithered against banding.
uniform vec3 uBase;
uniform vec3 uNebulaA;
uniform vec3 uNebulaB;
uniform vec3 uDirA;
uniform vec3 uDirB;
uniform vec3 uBandNormal;
uniform float uDim;
varying vec3 vDir;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
	vec3 d = normalize(vDir);
	float a = max(dot(d, uDirA), 0.0);
	float b = max(dot(d, uDirB), 0.0);
	vec3 color = uBase;
	color += uNebulaA * (pow(a, 3.0) * 0.5 + pow(a, 14.0) * 0.4);
	color += uNebulaB * (pow(b, 4.0) * 0.55);
	float band = 1.0 - abs(dot(d, uBandNormal));
	color += vec3(0.09, 0.075, 0.15) * pow(band, 12.0) * 0.55;
	color *= uDim;
	color += (hash(gl_FragCoord.xy) - 0.5) * (2.0 / 255.0);
	gl_FragColor = vec4(color, 1.0);
}
