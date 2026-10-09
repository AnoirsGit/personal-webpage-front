// Readable page content in front of the scene (src/lib/scene/occlusion.js): a mask of the
// cards, panels and text blocks over the viewport. Bright materials multiply by this, so
// they dim behind text and keep their full glow in the open sky.
uniform sampler2D uOcclusion;
uniform float uOccludeDim;
uniform vec2 uViewport;

float contentShade() {
	return 1.0 - uOccludeDim * texture2D(uOcclusion, gl_FragCoord.xy / uViewport).r;
}
