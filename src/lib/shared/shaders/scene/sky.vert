// Sky dome drawn just inside the far plane, centred on the camera (rotation only): behind
// everything, and depth-tested after the Earth so the pixels the planet covers are skipped.
varying vec3 vDir;

void main() {
	vDir = position;
	vec4 clip = projectionMatrix * vec4(mat3(modelViewMatrix) * position, 1.0);
	gl_Position = vec4(clip.xy, clip.w * 0.99999, clip.w);
}
