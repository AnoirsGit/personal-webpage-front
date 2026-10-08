uniform float uTime;
uniform float uMotion;
uniform vec3 uColor;
uniform vec3 uHot;
uniform float uFade;
uniform float uDim;
varying float vReveal;
varying float vKind;
varying float vSeed;
varying float vHover;
varying float vFacing;
varying float vScale;

void main() {
	// p in core radii; the sprite spans vScale core diameters
	vec2 p = (gl_PointCoord * 2.0 - 1.0) * vScale;
	float r = length(p);
	float core = exp(-r * r * 1.6);
	float halo = exp(-r * 0.95) * 0.42 + exp(-r * r * 0.18) * 0.1;
	float shape = core + halo;

	if (vKind < 0.5) {
		// faint four-point diffraction spikes on stars
		shape += (exp(-abs(p.x) * 7.0) * exp(-abs(p.y) * 0.8) +
			exp(-abs(p.y) * 7.0) * exp(-abs(p.x) * 0.8)) * 0.18;
	} else {
		// slow soft pulse ring: home is the calmest, process nodes the busiest
		float period = vKind > 2.5 ? 2.6 : (vKind > 1.5 ? 4.8 : 3.6);
		float t = fract(uTime / period + vSeed);
		float radius = mix(0.9, vScale * 0.92, t);
		float ring = exp(-pow((r - radius) * 2.6, 2.0)) * pow(1.0 - t, 1.5);
		shape += ring * (vKind > 1.5 && vKind < 2.5 ? 0.55 : 0.4) * mix(0.0, 1.0, uMotion);
		if (vKind > 1.5 && vKind < 2.5) shape += exp(-r * 0.7) * 0.12;
	}

	float alpha = shape * vReveal * vFacing * uFade * (1.0 + vHover * 0.45);
	if (alpha < 0.003) discard;
	vec3 color = mix(uColor, uHot, clamp(core * 1.2, 0.0, 1.0));
	gl_FragColor = vec4(color * alpha * uDim, 1.0);
}
