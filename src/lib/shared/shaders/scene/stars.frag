varying vec3 vColor;
varying float vAlpha;
varying float vScale;
varying float vHalo;

void main() {
	// p in core radii; a haloed star's sprite spans vScale core diameters
	vec2 p = (gl_PointCoord * 2.0 - 1.0) * vScale;
	float r2 = dot(p, p);
	if (r2 > vScale * vScale) discard;
	float core = exp(-r2 * 3.5);
	float halo = vHalo * (exp(-sqrt(r2) * 1.1) * 0.16 + exp(-r2 * 0.25) * 0.05);
	gl_FragColor = vec4(vColor * (core + halo) * vAlpha, 1.0);
}
