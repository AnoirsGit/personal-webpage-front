varying vec3 vColor;
varying float vAlpha;

void main() {
	vec2 p = gl_PointCoord * 2.0 - 1.0;
	float r2 = dot(p, p);
	if (r2 > 1.0) discard;
	float alpha = exp(-r2 * 3.5) * vAlpha;
	gl_FragColor = vec4(vColor * alpha, 1.0);
}
