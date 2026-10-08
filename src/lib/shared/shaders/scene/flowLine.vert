// Screen-space ribbons: each segment is a quad widened in pixels, so lines stay crisp at any
// distance. vT runs 0..1 along the whole polyline for drawing-on and travelling pulses.
uniform vec2 uViewport;
uniform float uPixelRatio;
uniform float uPhase;
attribute vec3 aA;
attribute vec3 aB;
attribute float aSide;
attribute float aEnd;
attribute vec2 aT;
attribute vec4 aLine;   // reveal start, reveal end, pulse speed (laps/s), seed
attribute vec4 aStyle;  // width (CSS px), base alpha, pulse count, -
varying float vT;
varying float vSide;
varying float vDraw;
varying float vHalfWidth;
varying vec4 vLine;
varying vec4 vStyle;

void main() {
	mat4 mvp = projectionMatrix * modelViewMatrix;
	vec4 clipA = mvp * vec4(aA, 1.0);
	vec4 clipB = mvp * vec4(aB, 1.0);
	vec2 halfViewport = uViewport * 0.5;
	vec2 screenA = clipA.xy / clipA.w * halfViewport;
	vec2 screenB = clipB.xy / clipB.w * halfViewport;
	vec2 dir = screenB - screenA;
	float len = length(dir);
	dir = len > 1e-5 ? dir / len : vec2(1.0, 0.0);
	vec2 across = vec2(-dir.y, dir.x);

	float halfWidth = aStyle.x * uPixelRatio * 0.5;
	vec4 clip = aEnd < 0.5 ? clipA : clipB;
	// half a pixel extra on each side for the anti-aliased edge, half a width along the line
	// to close the gaps between segments
	vec2 offset = across * aSide * (halfWidth + 1.0) + dir * (aEnd < 0.5 ? -halfWidth : halfWidth);
	clip.xy += offset / halfViewport * clip.w;
	gl_Position = clip;

	vT = mix(aT.x, aT.y, aEnd);
	vSide = aSide * (halfWidth + 1.0);
	vHalfWidth = halfWidth;
	vDraw = clamp((uPhase - aLine.x) / max(aLine.y - aLine.x, 1e-4), 0.0, 1.0);
	vLine = aLine;
	vStyle = aStyle;
}
