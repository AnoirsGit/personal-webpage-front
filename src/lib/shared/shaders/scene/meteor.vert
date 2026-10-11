// The shooting star: one quad from tail to head, its corners placed by parts/ShootingStar.svelte.
attribute float aAlong; // 0 at the tail, 1 at the head
attribute float aSide;  // -1 / 1 across
varying float vAlong;
varying float vSide;

void main() {
	vAlong = aAlong;
	vSide = aSide;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
