Project Complete

![koi](Koi-Project/2025_09_29_22_20_35_V1.gif)

Interactive Koi Pond (Three.js)

A small Three.js scene that renders a top-down koi pond with a custom water ripple shader, animated swimming koi fish (GLB), and a lily pad model. Click the water to create ripples

Features

Click-to-ripple water using a ShaderMaterial and ripple uniforms (multiple ripples support). 

Animated koi fish loaded from models/koi_fish.glb, cloned/spawned in a group, and updated each frame with an AnimationMixer. 

Fish movement behavior: bounded swimming + smooth yaw rotation + random “turn cone” steering

Fullscreen canvas layout via CSS.

**Run Locally**

Because the app uses fetch() for shader files, you need an HTTP server.

**How It Works**

Water ripple system (water.js):

Builds a PlaneGeometry(10, 10, 200, 200) and applies a ShaderMaterial with uniforms for time and ripple data. 

On click, raycasts into the water plane and writes the hit point into ripplePositions / rippleStartTimes (up to MAX_RIPPLES = 10). 

update() advances the time uniform each frame. 

Fish system:

Loads a GLB once, clones it count times, scales and positions fish, then plays the first animation clip via AnimationMixer. 

Each fish stores movement state in userData (direction, speed, turning timers, target rotation). 

Movement:

Moves forward each tick.

Reflects direction at bounds.

Occasionally chooses a new target direction restricted to a turning cone, then lerps toward it.

Smoothly rotates yaw to align with swimming direction and locks x/z rotation to avoid flips/rolls. 

Scene setup (app.js):

Creates scene, orthographic camera, renderer, and lighting.

Instantiates WaterManager + FishManager, spawns 5 fish, loads lily pads, and runs the animation loop.
