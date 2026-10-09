uniform vec3 uInk;
uniform vec3 uInkLit;
uniform vec3 uAccent;
uniform float uDim;
varying vec3 vNormalV;
varying float vFacing;
varying float vAccent;
varying float vLight;
varying float vAlpha;

void main() {
	if (vFacing <= 0.0) discard;
	vec2 p = gl_PointCoord * 2.0 - 1.0;
	p.y = -p.y;
	float len = length(vNormalV.xy);
	vec2 m = len > 1e-4 ? vNormalV.xy / len : vec2(1.0, 0.0);
	float along = dot(p, m) / max(vFacing, 0.18);
	float across = dot(p, vec2(-m.y, m.x));
	float d = length(vec2(along, across));
	float disc = 1.0 - smoothstep(0.5, 1.0, d);
	if (disc <= 0.0) discard;

	float accent = clamp(vAccent, 0.0, 1.0);
	vec3 color = mix(mix(uInk, uInkLit, vLight), uAccent, accent);
	float limb = smoothstep(0.0, 0.3, vFacing);
	float alpha = disc * vAlpha * limb * (0.42 + 0.48 * vLight + 0.22 * accent);
	gl_FragColor = vec4(color * uDim, alpha * contentShade());
}
