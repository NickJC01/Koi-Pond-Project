class FishManager {
    constructor(scene, modelPath) {
        this.scene = scene;
        this.modelPath = modelPath; // Path to koi_fish.glb
        this.loader = new THREE.GLTFLoader(); // Loader for GLB models
        this.fishGroup = new THREE.Group(); // Group to hold all fish
        this.mixer = null; // Animation mixer for handling fish animations
        this.scene.add(this.fishGroup);

        // Extended swim bounds for off-screen turns
        this.swimBounds = { x: 6, z: 6 }; // Adjust these values as needed for browser
        this.turnConeAngle = 40; // Turning cone angle in degrees, higher degree turns may break fish turning logic
    }

    spawnFish(count = 5) {
        this.loader.load(
            this.modelPath,
            (gltf) => {
                const fishTemplate = gltf.scene;
                const animations = gltf.animations;

                if (!this.mixer) {
                    this.mixer = new THREE.AnimationMixer(this.fishGroup);
                }

                for (let i = 0; i < count; i++) {
                    const fish = fishTemplate.clone();

                    const scaleFactor = 0.5;
                    fish.scale.set(scaleFactor, scaleFactor, scaleFactor);
                    fish.position.set(
                        (Math.random() - 0.5) * 10, // Larger range for X
                        -1.25, // Fixed Y position to stay within the water volume
                        (Math.random() - 0.5) * 10  // Larger range for Z
                    );

                    // Add metadata for swimming behavior
                    fish.userData = {
                        direction: new THREE.Vector3(
                            Math.random() - 0.5,
                            0,
                            Math.random() - 0.5
                        ).normalize(), 
                        speed: 0.01 + Math.random() * 0.02, // Random swimming speed
                        turning: false, // Whether the fish is currently turning
                        turnStartTime: 0, // Time the turn started
                        turnDuration: 3000, // Duration of a turn (in ms)
                        turnTarget: null, // Target direction for the turn
                        targetRotationY: 0, // Target rotation for smooth turning
                        nextTurnTime: performance.now() + Math.random() * 5000, // Randomize initial turn time
                    };

                    // Play the swimming animation
                    if (animations.length > 0) {
                        const action = this.mixer.clipAction(animations[0], fish);
                        action.play();
                    }

                    this.fishGroup.add(fish);
                }
            },
            undefined,
            (error) => {
                console.error(`Error loading model ${index + 1}:`, error);
            }
        );
    }

    animateFish(deltaTime) {
        if (this.mixer) {
            this.mixer.update(deltaTime); // Use deltaTime to update animations
        }

        this.fishGroup.children.forEach((fish) => {
            const userData = fish.userData;
            const { direction, speed } = userData;

            // Gradually move the fish along its direction vector
            fish.position.add(direction.clone().multiplyScalar(speed));

            const bounds = this.swimBounds;

            // Boundary check: Reflect direction if fish hits the extended bounds
            if (Math.abs(fish.position.x) > bounds.x || Math.abs(fish.position.z) > bounds.z) {
                if (Math.abs(fish.position.x) > bounds.x) {
                    direction.x = -direction.x;
                }
                if (Math.abs(fish.position.z) > bounds.z) {
                    direction.z = -direction.z;
                }

                userData.direction = direction.normalize();

                // Immediately adjust the fish's rotation to the new direction
                userData.targetRotationY = Math.atan2(-direction.z, direction.x);
            }

            // Handle random turning within the cone
            if (!userData.turning && performance.now() > userData.nextTurnTime) {
                userData.turning = true;
                userData.turnStartTime = performance.now();
                userData.turnDuration = 2000 + Math.random() * 2000; // 2-4 seconds
                let targetDirection = new THREE.Vector3(
                    Math.random() - 0.5,
                    0,
                    Math.random() - 0.5
                ).normalize();

                // Restrict to turning cone
                const angleToTarget = direction.angleTo(targetDirection);
                const maxTurnAngle = THREE.MathUtils.degToRad(this.turnConeAngle);

                if (angleToTarget > maxTurnAngle) {
                    const axis = new THREE.Vector3(0, 1, 0); // Rotate around the Y-axis, this is important so that the fish doesn't start doing random backflips
                    targetDirection = direction.clone().applyAxisAngle(axis, maxTurnAngle * Math.sign(Math.random() - 0.5));
                }

                userData.turnTarget = targetDirection;
            }

            if (userData.turning) {
                const elapsed = performance.now() - userData.turnStartTime;
                const t = elapsed / userData.turnDuration; // Normalize time for smooth interpolation

                if (t >= 1.0) {
                    userData.turning = false;
                    userData.direction = userData.turnTarget.clone(); // Finalize new direction
                    userData.nextTurnTime = performance.now() + 3000 + Math.random() * 2000; // Next random turn
                } else {
                    userData.direction.lerp(userData.turnTarget, 0.02);
                    userData.direction.normalize();

                    userData.targetRotationY = Math.atan2(-userData.direction.z, userData.direction.x);
                }
            }

            // Smoothly rotate the fish to align with its direction
            const currentRotationY = fish.rotation.y;
            const targetRotationY = userData.targetRotationY;
            fish.rotation.y += (targetRotationY - currentRotationY) * 0.1;

            // Lock rotation to the Y-axis
            fish.rotation.x = 0; // Prevent tilting forwards or backwards
            fish.rotation.z = 0; // Prevent rolling
        });
    }
}

// Attach FishManager to the global window object for usage in app.js - don't forget this part
window.FishManager = FishManager;