uniform vec3 uColor;
uniform vec3 uHot;
uniform float uFade;
varying float vAlong;
varying float vSide;

void main() {
	// a bright core with a soft glow across, brightening towards the head
	float across = exp(-vSide * vSide * 6.0) + 0.25 * exp(-vSide * vSide * 1.5);
	// clamped: with MSAA a varying is read at the pixel centre, which can lie past the tail
	// (vAlong < 0), and pow() of a negative base is undefined
	float trail = pow(max(vAlong, 0.0), 2.2);
	float head = smoothstep(0.84, 1.0, vAlong);
	vec3 color = mix(uColor, uHot, head) * (trail * 1.1 + head * 1.2) * across;
	gl_FragColor = vec4(color * uFade * contentShade(), 1.0);
}
