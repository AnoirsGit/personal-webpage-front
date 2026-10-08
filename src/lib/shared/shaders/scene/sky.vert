// Sky dome drawn on the far plane, centred on the camera (rotation only).
varying vec3 vDir;

void main() {
	vDir = position;
	vec4 clip = projectionMatrix * vec4(mat3(modelViewMatrix) * position, 1.0);
	gl_Position = clip.xyww;
}
