uniform float uTime;
uniform float uMotion;
uniform vec3 uColor;
uniform vec3 uHot;
uniform float uFade;
uniform float uDim;
varying float vT;
varying float vSide;
varying float vDraw;
varying float vHalfWidth;
varying vec4 vLine;
varying vec4 vStyle;

void main() {
	if (vDraw <= 0.0 || vT > vDraw) discard;
	float edge = clamp(vHalfWidth + 0.5 - abs(vSide), 0.0, 1.0);
	if (edge <= 0.0) discard;

	// bright tip while the line is still being drawn
	float tip = (1.0 - smoothstep(0.0, 0.08, vDraw - vT)) * (1.0 - step(0.999, vDraw));

	float pulses = 0.0;
	float count = vStyle.z;
	float speed = vLine.z;
	if (count > 0.5 && vDraw > 0.999) {
		for (int k = 0; k < 3; k++) {
			if (float(k) >= count) break;
			float head = fract(uTime * abs(speed) + vLine.w + float(k) / count);
			if (speed < 0.0) head = 1.0 - head;
			float d = (head - vT) * sign(speed);
			float tail = d > 0.0 ? exp(-d * 14.0) : 0.0;
			pulses += tail * 0.5 + exp(-pow(d * 70.0, 2.0)) * 1.3;
		}
		pulses *= mix(0.55, 1.0, uMotion);
	}

	vec3 color = uColor * (vStyle.y + tip * 0.9) + uHot * pulses;
	gl_FragColor = vec4(color * edge * uFade * uDim * contentShade(), 1.0);
}
