struct impact {
    vec3 impactPosition;
    float impactMaxRadius;
    float impactRatio;
};
uniform impact impacts[1];
uniform float waveHeight;
uniform float scaling;
attribute vec3 center;
attribute vec2 bUv;
varying float vFinalStep;
varying float vMap;
#include <common>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif

            #include <begin_vertex>
    float finalStep = 0.0;
    for(int i = 0; i < 1; i++) {
        float dist = distance(center, impacts[i].impactPosition);
        float curRadius = impacts[i].impactMaxRadius * impacts[i].impactRatio;
        float sstep = smoothstep(0., curRadius, dist) - smoothstep(curRadius - (.25 * impacts[i].impactRatio), curRadius, dist);
        sstep *= 1. - impacts[i].impactRatio;
        finalStep += sstep;
    }
    finalStep = clamp(finalStep, 0., 1.);
    vFinalStep = finalStep;
    float scale = scaling;
    transformed = (position - center) * mix(1., scale * 1.25, finalStep) + center; // scale on wave
    transformed += normal * finalStep * waveHeight; // lift on wave

	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}
