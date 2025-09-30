async function fetchShader(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.text();
}

async function init() {
    const vertexShaderSrc = await fetchShader('shaders/vertexShader.glsl');
    const fragmentShaderSrc = await fetchShader('shaders/fragmentShader.glsl');

    const scene = new THREE.Scene();

    const aspectRatio = window.innerWidth / window.innerHeight;
    const cameraHeight = 7;
    const camera = new THREE.OrthographicCamera(
        -cameraHeight * aspectRatio / 2,
        cameraHeight * aspectRatio / 2,
        cameraHeight / 2,
        -cameraHeight / 2,
        0.1,
        1000
    );
    camera.position.set(0, 5, 0);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('scene-container').appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(ambientLight, directionalLight);

    const waterManager = new WaterManager(scene, renderer, camera, vertexShaderSrc, fragmentShaderSrc);
    const fishManager = new FishManager(scene, 'models/koi_fish.glb');
    fishManager.spawnFish(5);

    function addBoundaryPlaneWithCutout(scene) {
        const outerWidth = 50; // Total width of the large plane
        const outerHeight = 50; // Total height of the large plane
        const innerWidth = 10; // Width of the cut-out middle
        const innerHeight = 10; // Height of the cut-out middle
    
        // Create the outer rectangle
        const outerShape = new THREE.Shape();
        outerShape.moveTo(-outerWidth / 2, -outerHeight / 2);
        outerShape.lineTo(-outerWidth / 2, outerHeight / 2);
        outerShape.lineTo(outerWidth / 2, outerHeight / 2);
        outerShape.lineTo(outerWidth / 2, -outerHeight / 2);
        outerShape.lineTo(-outerWidth / 2, -outerHeight / 2);
    
        // Create the inner rectangle (cut-out area)
        const innerHole = new THREE.Path();
        innerHole.moveTo(-innerWidth / 2, -innerHeight / 2);
        innerHole.lineTo(-innerWidth / 2, innerHeight / 2);
        innerHole.lineTo(innerWidth / 2, innerHeight / 2);
        innerHole.lineTo(innerWidth / 2, -innerHeight / 2);
        innerHole.lineTo(-innerWidth / 2, -innerHeight / 2);
    
        outerShape.holes.push(innerHole);
    
        const boundaryGeometry = new THREE.ShapeGeometry(outerShape);
        const boundaryMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide,
        });
    
        const boundaryMesh = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
        boundaryMesh.rotation.x = -Math.PI / 2; // Rotate to lay flat
        boundaryMesh.position.set(0, 3, 0); // Set above the water plane
    
        scene.add(boundaryMesh);
    }
    
    addBoundaryPlaneWithCutout(scene);

    // Animation clock
    const clock = new THREE.Clock();

    function addLilyPads() {
        const loader = new THREE.GLTFLoader();
        loader.load(
            'models/lily_pads.glb',
            (gltf) => {
                const lilyPads = gltf.scene;

                // Position and scale lily pads
                lilyPads.scale.set(0.2, 0.2, 0.2); // Adjust scale
                lilyPads.position.set(-3.5, -0.025, 2.5); // Position on the pond surface

                scene.add(lilyPads);
            },
            undefined,
            (error) => {
                console.error('Error loading lily_pads.glb:', error);
            }
        );
    }
    addLilyPads();
    function animate() {
        const deltaTime = clock.getDelta(); // Use delta time for smooth animation updates

        waterManager.update();
        fishManager.animateFish(deltaTime);

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    animate();

    window.addEventListener('resize', () => {
        const newAspectRatio = window.innerWidth / window.innerHeight;
        camera.left = -cameraHeight * newAspectRatio / 2;
        camera.right = cameraHeight * newAspectRatio / 2;
        camera.top = cameraHeight / 2;
        camera.bottom = -cameraHeight / 2;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

init().catch(console.error);