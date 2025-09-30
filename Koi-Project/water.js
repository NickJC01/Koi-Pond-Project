class WaterManager {
    constructor(scene, renderer, camera, vertexShaderSrc, fragmentShaderSrc) {
        this.scene = scene;
        this.renderer = renderer;
        this.camera = camera;
        this.vertexShaderSrc = vertexShaderSrc;
        this.fragmentShaderSrc = fragmentShaderSrc;

        this.MAX_RIPPLES = 10;
        this.planeMaterial = null; // Initialize as null
        this.initWater();
    }

    initWater() {
        // Texture loader for the pond base
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('textures/pondbase.webp', (pondBaseTexture) => {
            const planeGeometry = new THREE.PlaneGeometry(10, 10, 200, 200);
            this.planeMaterial = new THREE.ShaderMaterial({
                vertexShader: this.vertexShaderSrc,
                fragmentShader: this.fragmentShaderSrc,
                uniforms: {
                    time: { value: 0.0 },
                    ripplePositions: { value: Array(this.MAX_RIPPLES).fill(new THREE.Vector3()) },
                    rippleStartTimes: { value: Array(this.MAX_RIPPLES).fill(0) },
                    activeRipples: { value: 0 },
                    baseColor: { value: new THREE.Color(0x87CEFA) },
                    opacity: { value: 0.5 },
                    backgroundTexture: { value: pondBaseTexture },
                },
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
                blending: THREE.NormalBlending,
            });

            const waterPlane = new THREE.Mesh(planeGeometry, this.planeMaterial);
            waterPlane.rotation.x = Math.PI / 2;
            waterPlane.position.y = 0.01;
            this.scene.add(waterPlane);

            // Ripple interaction logic
            this.ripplePositions = Array.from({ length: this.MAX_RIPPLES }, () => new THREE.Vector3());
            this.rippleStartTimes = Array(this.MAX_RIPPLES).fill(0);
            this.activeRipples = 0;

            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();

            this.renderer.domElement.addEventListener('click', (event) => {
                const rect = this.renderer.domElement.getBoundingClientRect();
                mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                raycaster.setFromCamera(mouse, this.camera);
                const intersects = raycaster.intersectObject(waterPlane);

                if (intersects.length > 0) {
                    const point = intersects[0].point;

                    if (this.activeRipples < this.MAX_RIPPLES) {
                        this.ripplePositions[this.activeRipples].set(point.x, point.z, 0);
                        this.rippleStartTimes[this.activeRipples] = this.planeMaterial.uniforms.time.value;
                        this.activeRipples++;
                    } else {
                        this.ripplePositions.shift();
                        this.rippleStartTimes.shift();
                        this.ripplePositions.push(new THREE.Vector3(point.x, point.z, 0));
                        this.rippleStartTimes.push(this.planeMaterial.uniforms.time.value);
                    }

                    this.planeMaterial.uniforms.ripplePositions.value = this.ripplePositions.slice();
                    this.planeMaterial.uniforms.rippleStartTimes.value = this.rippleStartTimes.slice();
                    this.planeMaterial.uniforms.activeRipples.value = this.activeRipples;
                }
            });
        });
    }

    update() {
        if (this.planeMaterial && this.planeMaterial.uniforms) {
            const elapsedTime = performance.now() * 0.001;
            this.planeMaterial.uniforms.time.value = elapsedTime;
        }
    }
}

// Attach WaterManager to the global window object for usage in app.js
window.WaterManager = WaterManager;