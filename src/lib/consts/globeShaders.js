export const roundFragmentShader = (fragmentShader, sizeOfPoint) => {
    return `
        uniform vec3 gradInner;
	    uniform vec3 gradOuter;
	    varying float vFinalStep;
	    varying float vMap;
	    ${fragmentShader}
        `
        .replace(
            `vec4 diffuseColor = vec4( diffuse, opacity );`,
            `
            // shaping the point, pretty much from The Book of Shaders
            vec2 hUv = (vUv - .1);
            int N = 8;
            float a = atan(hUv.x,hUv.y);
            float r = PI2/float(N);
            float d = cos(floor(.5+a/r)*r-a)*length(hUv);
            float f = cos(PI / float(N)) * .5;
            if (length(vUv - ${sizeOfPoint}) > ${sizeOfPoint}) discard;
            vec3 grad = mix(gradInner, gradOuter, clamp( d / f, 0., 1.)); // gradient
            vec3 diffuseMap = diffuse * 1.;
            vec3 col = mix(diffuseMap, grad, vFinalStep); // color on wave
            float opct=1.;
            vec4 diffuseColor = vec4( col , opct );
            `
        )
}

export const vertexShaderWithBoom = (shaderVertex, impacts) => {
    return `
        struct impact {
          vec3 impactPosition;
          float impactMaxRadius;
          float impactRatio;
        };
        uniform impact impacts[${impacts.length}];
        uniform float waveHeight;
        uniform float scaling;
        attribute vec3 center;
        attribute vec2 bUv;
        varying float vFinalStep;
        varying float vMap;
        ${shaderVertex}
        `
        .replace(
            `#include <begin_vertex>`,
            `
            #include <begin_vertex>
            float finalStep = 0.0;
            for (int i = 0; i < ${impacts.length};i++){
              float dist = distance(center, impacts[i].impactPosition);
              float curRadius = impacts[i].impactMaxRadius * impacts[i].impactRatio;
              float sstep = smoothstep(0., curRadius, dist) - smoothstep(curRadius - (.25 * impacts[i].impactRatio ), curRadius, dist);
              sstep *= 1. - impacts[i].impactRatio;
              finalStep += sstep;
            }
            finalStep = clamp(finalStep, 0., 1.);
            vFinalStep = finalStep;
            float scale = scaling;
            transformed = (position - center) * mix(1., scale * 1.25, finalStep) + center; // scale on wave
            transformed += normal * finalStep * waveHeight; // lift on wave
            `
        )
}