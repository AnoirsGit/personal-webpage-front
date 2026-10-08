// Dot-matrix land. Each dot is a disc lying on the sphere: the fragment shader squashes it
// by how much it faces the camera, so the limb reads as curved, not as a sticker sheet.
uniform float uTime;
uniform float uProjScale;
uniform float uDotSize;
uniform float uIntro;
uniform float uMotion;
uniform vec3 uHome;
uniform vec3 uLightDir;
uniform float uHomeBoost;
attribute float aRand;
attribute float aHome;
varying vec3 vNormalV;
varying float vFacing;
varying float vAccent;
varying float vLight;
varying float vAlpha;

void main() {
	vec3 n = normalize(position);
	float fromHome = acos(clamp(dot(n, uHome), -1.0, 1.0));

	// Load-in: land appears outward from home.
	float front = uIntro * 3.6;
	float reveal = 1.0 - smoothstep(front - 0.5, front, fromHome);

	// A slow soft ripple leaves home every few seconds.
	float phase = fract(uTime / 6.0);
	float ring = exp(-pow((fromHome - phase * 0.6) / 0.03, 2.0)) * pow(1.0 - phase, 2.0) * uMotion;

	// Sparse warm "city lights" that breathe.
	float lights = step(0.994, aRand) * (0.5 + 0.5 * sin(uTime * (0.5 + aRand * 1.5) + aRand * 80.0));

	vAccent = aHome * uHomeBoost + ring * 0.7 + lights * 0.55;

	vec4 mv = modelViewMatrix * vec4(position, 1.0);
	gl_Position = projectionMatrix * mv;
	vec3 nv = normalize(normalMatrix * n);
	vNormalV = nv;
	vFacing = dot(nv, normalize(-mv.xyz));
	vLight = clamp(dot(normalize(mat3(modelMatrix) * n), uLightDir) * 0.5 + 0.5, 0.0, 1.0);
	vAlpha = reveal;

	float size = uDotSize * (1.0 + aHome * 0.06 + ring * 0.6) * mix(0.3, 1.0, reveal);
	gl_PointSize = size * uProjScale / -mv.z;
}
