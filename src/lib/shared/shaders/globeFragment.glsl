uniform vec3 customColor;
uniform vec3 diffuse;
#ifndef FLAT_SHADED
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
    #include <clipping_planes_fragment>

    // shaping the point, pretty much from The Book of Shaders
    vec2 hUv = (vUv - .5); // Center the UV coordinates
    float distanceFromCenter = length(hUv); // Distance from the center

    // Check if the pixel is outside a certain radius
    if(distanceFromCenter > 0.5)
        discard;

    vec3 diffuseMap = (length(customColor) > 0.0) ? (diffuse * customColor) : vec3(1.0);
    vec3 col = diffuseMap; // Use constant color or any other color

    float opct = 1.;
    vec4 diffuseColor = vec4(col, opct);

    #include <logdepthbuf_fragment>
    #include <map_fragment>
    #include <color_fragment>
    #include <alphamap_fragment>
    #include <alphatest_fragment>
    #include <alphahash_fragment>
    #include <specularmap_fragment>
    ReflectedLight reflectedLight = ReflectedLight(vec3(0.0), vec3(0.0), vec3(0.0), vec3(0.0));
    #ifdef USE_LIGHTMAP
    vec4 lightMapTexel = texture2D(lightMap, vLightMapUv);
    reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
    #else
    reflectedLight.indirectDiffuse += vec3(1.0);
    #endif
    #include <aomap_fragment>
    reflectedLight.indirectDiffuse *= diffuseColor.rgb;
    vec3 outgoingLight = reflectedLight.indirectDiffuse;
    #include <envmap_fragment>
    #include <opaque_fragment>
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
    #include <premultiplied_alpha_fragment>
    #include <dithering_fragment>
}
