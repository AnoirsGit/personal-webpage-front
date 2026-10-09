uniform vec3 uColor;
uniform vec3 uHot;
uniform float uFade;
varying float vAlong;
varying float vSide;

void main() {
	// a bright core with a soft glow across, brightening towards the head
	float across = exp(-vSide * vSide * 6.0) + 0.25 * exp(-vSide * vSide * 1.5);
	float trail = pow(vAlong, 2.2);
	float head = smoothstep(0.84, 1.0, vAlong);
	vec3 color = mix(uColor, uHot, head) * (trail * 1.1 + head * 1.2) * across;
	gl_FragColor = vec4(color * uFade * contentShade(), 1.0);
}
