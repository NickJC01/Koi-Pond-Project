#define MAX_RIPPLES 10  // Maximum number of simultaneous ripples

uniform float time;                    // Current scene time
uniform vec3 ripplePositions[MAX_RIPPLES]; // Ripple positions
uniform float rippleStartTimes[MAX_RIPPLES]; // Ripple start times
uniform int activeRipples;             // Number of active ripples
varying vec2 vUv;                      // Texture coordinates
varying float vWave;                   // Combined wave height
varying vec3 vNormal;                  // Perturbed normal for lighting

// Pseudo-random function for better noise
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// Perlin-inspired smoothed noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    // Interpolation
    vec2 u = f * f * (3.0 - 2.0 * f);

    // Four corners
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    // Bilinear interpolation
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Fractal Brownian Motion (multi-octave noise)
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 5; i++) { // 5 octaves for complexity
        value += amplitude * noise(p * frequency);
        frequency *= 2.0; // Increase frequency
        amplitude *= 0.5; // Decrease amplitude
    }

    return value;
}

void main() {
    vec3 pos = position;

    // Base water movement
    float baseNoise = fbm(pos.xy * 1.0 + time * 0.1);
    float baseWave = 0.03 * baseNoise;

    // Ripple contribution
    float totalRipple = 0.0;

    for (int i = 0; i < activeRipples; i++) {
        float elapsedTime = time - rippleStartTimes[i];
        float distanceFromRipple = distance(vec2(pos.x, pos.y), ripplePositions[i].xy);

        float waveFrequency = 10.0;  // Higher frequency for thinner waves
        float waveSpeed = 2.0;       // Ripple propagation speed
        float decayRate = 1.5;       // Ripple decay over distance
        float timeToReach = distanceFromRipple / waveSpeed; // Time for ripple to reach this point

        if (elapsedTime >= timeToReach) {
            float localTime = elapsedTime - timeToReach; // Time since ripple reached this point

            // Amplitude decays over time and distance
            float amplitude = 0.2 * exp(-distanceFromRipple * decayRate) * exp(-localTime * decayRate);

            // Generate ripple with thinner waves
            float ripple = amplitude * sin(distanceFromRipple * waveFrequency - localTime * waveSpeed);

            totalRipple += ripple;
        }
    }

    // Combine base waves and ripples
    float totalWave = baseWave + totalRipple;

    pos.z += totalWave;

    // Pass values to the fragment shader
    vUv = uv;
    vWave = totalRipple;
    vNormal = normalize(normal + vec3(0.0, 0.0, totalWave));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}