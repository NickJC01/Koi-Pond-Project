uniform vec3 baseColor;          // Base water color
uniform float opacity;           // Transparency level
uniform sampler2D backgroundTexture; // Background texture (pond base)
varying vec2 vUv;                // Texture coordinates
varying float vWave;             // Ripple height
varying vec3 vNormal;            // Perturbed normal for lighting

void main() {
    // Distort UVs based on ripple height for subtle refraction effect
    vec2 distortedUv = vUv + vWave * 0.05; // Increased distortion for ripples

    // Sample the background texture (pond base)
    vec3 background = texture2D(backgroundTexture, distortedUv).rgb;

    // Add Fresnel effect for light interaction
    vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
    float fresnel = pow(1.0 - dot(viewDir, normalize(vNormal)), 3.0);
    vec3 highlightColor = vec3(1.0, 1.0, 1.0) * fresnel;

    // Enhance ripple edges
    float rippleEdge = smoothstep(0.1, 0.3, abs(vWave)) * 2.0; // Stronger edges
    vec3 rippleOutline = vec3(1.0) * rippleEdge; // White outline for ripple peaks

    // Add shadows for ripples (darkened regions beneath waves)
    float shadow = smoothstep(0.1, 0.3, -vWave) * 0.4; // Darker shadows
    vec3 rippleShadow = vec3(0.0, 0.0, 0.0) * shadow; // Black shadows

    // Blend base color, background, shadows, and highlights
    vec3 waterColor = mix(baseColor, background, 0.6); // Base water with background texture
    waterColor += highlightColor * rippleEdge; // Add Fresnel highlights to edges
    waterColor += rippleOutline; // Add white outline
    waterColor += rippleShadow; // Add ripple shadows

    // Final color with transparency
    gl_FragColor = vec4(waterColor, opacity);
}
