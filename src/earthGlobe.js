import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitalMechanics } from './orbitalMechanics.js';

class EarthGlobe {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.earthGroup = null;
        
        // Earth properties
        this.rotationSpeed = 0.0005;
        this.autoRotate = true;
        this.cloudRotationSpeed = 0.0003;
        
        // Performance tracking
        this.clock = new THREE.Clock();
        this.fps = 0;
        
        // Loaded models
        this.models = {};
        
        // Orbital mechanics system
        this.orbitalMechanics = new OrbitalMechanics();
        
        // Earth center reference (ALWAYS at origin for proper orbital mechanics)
        this.ensureEarthCenter = () => {
            // Keep Earth group at origin
            if (this.earthGroup) {
                this.earthGroup.position.set(0, 0, 0);
            }
            // Keep visual Earth at origin within its group
            if (this.models.earth) {
                this.models.earth.position.set(0, 0, 0);
            }
            // CRITICAL: Keep solid core at absolute origin for orbital mechanics
            if (this.models.earthCore) {
                this.models.earthCore.position.set(0, 0, 0);
            }
        };
    }

    async initialize() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            throw new Error(`Container ${this.containerId} not found`);
        }

        await this.setupScene();
        await this.setupEarth();
        await this.setupEnvironment();
        this.setupControls();
        
        console.log('🌍 Earth globe initialized');
    }

    async setupScene() {
        const width = this.container.clientWidth || 800;
        const height = this.container.clientHeight || 600;
        
        console.log('🌍 Setting up 3D scene with size:', width, 'x', height);

        // Scene
        this.scene = new THREE.Scene();
        // Always use transparent background, never set a stars image
        this.scene.background = null;
        this.scene.fog = null;

        // Camera - positioned to see Earth immediately
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 3); // Closer to Earth
        this.camera.lookAt(0, 0, 0); // Look at Earth

        // Renderer - optimized for Windows performance
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false,
            alpha: true, // Enable transparency so CSS background shows
            powerPreference: "high-performance",
            precision: "lowp",
            stencil: false,
            depth: true,
            preserveDrawingBuffer: true // Ensures transparency is always respected
        });
        
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(0.8); // Lower pixel ratio for Windows
        this.renderer.toneMapping = THREE.NoToneMapping;
        this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
        this.renderer.physicallyCorrectLights = false;
        this.renderer.shadowMap.enabled = false;
        this.renderer.autoClear = true;
        this.renderer.sortObjects = false; // Disable sorting for performance

        this.container.appendChild(this.renderer.domElement);
        
        console.log('🎨 Renderer added to container:', this.container);
        console.log('📐 Container size:', width, 'x', height);

        // Lighting
        this.setupLighting();
    }

    setupLighting() {
        // Proper lighting to show both day and night sides
        this.sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
        this.sunLight.position.set(50, 30, 50); // Position to illuminate Earth properly
        this.sunLight.castShadow = false; // Disabled for performance
        this.scene.add(this.sunLight);

        // Ambient light for overall illumination
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.8);
        this.scene.add(this.ambientLight);

        // Additional light to ensure visibility
        this.fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
        this.fillLight.position.set(-30, -20, -30);
        this.scene.add(this.fillLight);
    }

    async setupEarth() {
        this.earthGroup = new THREE.Group();
        this.earthGroup.rotation.z = -23.4 * Math.PI / 180; // Earth's axial tilt
        this.earthGroup.position.set(0, 0, 0); // Ensure Earth group is at origin
        this.scene.add(this.earthGroup);

        // Create Earth geometry (always create, don't rely on GLB)
        this.createEarthGeometry();
        
        // Create invisible solid Earth core for orbital mechanics
        this.createSolidEarthCore();
        
        // Create Moon geometry (always create, don't rely on GLB)
        this.createMoonGeometry();
        
        // Try to load GLB models as enhancement
        await this.loadEarthModel();
        await this.loadMoonModel();
    }

    createEarthGeometry() {
        // Create Earth as a SOLID sphere at (0,0,0) - realistic Earth
        const geometry = new THREE.SphereGeometry(1, 64, 64);
        const material = new THREE.MeshLambertMaterial({
            color: 0x4a90e2,  // Better Earth blue color
            emissive: 0x001122,  // Slight emission for visibility
            side: THREE.FrontSide,  // Only front faces (solid)
            wireframe: false  // NEVER wireframe - always solid
        });
        const earth = new THREE.Mesh(geometry, material);
        earth.position.set(0, 0, 0); // Ensure Earth is at origin
        earth.castShadow = false;
        earth.receiveShadow = true;
        earth.name = 'Earth-Solid';
        this.earthGroup.add(earth);
        this.models.earth = earth;
        console.log('🌍 SOLID Earth sphere created at origin - NOT HOLLOW');
    }
    
    createSolidEarthCore() {
        // This is now redundant since we ensure the main Earth is always solid
        // But keep for backward compatibility with orbital mechanics
        const coreGeometry = new THREE.SphereGeometry(0.98, 16, 16);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,  // Core color for debugging
            transparent: true,
            opacity: 0,
            visible: false    // Invisible by default
        });
        
        const earthCore = new THREE.Mesh(coreGeometry, coreMaterial);
        earthCore.position.set(0, 0, 0); // Always at origin
        earthCore.name = 'Earth-Core-Debug';
        
        // Add to earthGroup so it rotates with Earth
        this.earthGroup.add(earthCore);
        this.models.earthCore = earthCore;
        
        console.log('🌍 Earth core created (for orbital mechanics reference)');
    }

    createSimpleEarth() {
        // Fallback method - same as createEarthGeometry
        this.createEarthGeometry();
    }

    createSimpleMoon() {
        // Try to load Moon model first, fallback to simple sphere
        this.loadMoonModel().catch(() => {
            this.createBasicMoon();
        });
    }

    async loadMoonModel() {
        const loader = new GLTFLoader();
        
        return new Promise((resolve, reject) => {
            const moonPath = '/assets/models/moon.glb';
            console.log('Loading Moon model from:', moonPath);
            
            loader.load(
                moonPath,
                (gltf) => {
                    console.log('Moon GLB model loaded successfully');
                    const moon = gltf.scene;
                    moon.scale.set(0.25, 0.25, 0.25);
                    moon.name = 'Moon-GLB';
                    
                    if (this.models.moon) {
                        this.scene.remove(this.models.moon);
                    }
                    
                    this.scene.add(moon);
                    this.models.moon = moon;
                    
                    moon.userData.orbit = {
                        radius: 4.5,
                        angle: 0,
                        speed: 0.005
                    };
                    
                    this.createMoonOrbitPath(moon.userData.orbit.radius);
                    resolve(moon);
                },
                (progress) => {
                    console.log('Moon loading progress:', Math.round(progress.loaded / progress.total * 100) + '%');
                },
                (error) => {
                    console.warn('Moon GLB model not found, using fallback:', error);
                    resolve(this.models.moon);
                }
            );
        });
    }

    createMoonGeometry() {
        // Create Moon with proper size relative to Earth
        // Moon radius is about 1/4 of Earth's radius
        const geometry = new THREE.SphereGeometry(0.25, 32, 32);  // Higher detail
        const material = new THREE.MeshPhongMaterial({
            color: 0xaaaaaa,
            shininess: 5,
            transparent: false,
            emissive: 0x222222,  // Slight glow so it's visible
            specular: 0x333333,
            wireframe: false  // NEVER wireframe - always solid
        });
        const moon = new THREE.Mesh(geometry, material);
        moon.castShadow = false;
        moon.receiveShadow = true;
        moon.name = 'Moon-Solid';
        this.scene.add(moon); // Add to scene, not earthGroup
        this.models.moon = moon;
        console.log('🌙 SOLID Moon created - NOT HOLLOW');

        // Moon orbit MUCH further from Earth to avoid overlap
        moon.userData.orbit = {
            radius: 6.0,  // Increased to 6.0 to ensure it's well outside Earth
            angle: 0,
            speed: 0.003  // Slower speed for realistic orbit
        };
        
        console.log('🌙 Moon positioned at distance 6.0 from Earth center');
        console.log('🌍 Earth radius is 1.0, so Moon is 5.0 units away from surface');
        
        // Create visible Moon orbit path
        this.createMoonOrbitPath(moon.userData.orbit.radius);
    }

    // Utility: Place asteroid in orbit around Earth
    placeAsteroidInOrbit(asteroidMesh, radius, angle) {
        asteroidMesh.position.x = radius * Math.cos(angle);
        asteroidMesh.position.z = radius * Math.sin(angle);
        asteroidMesh.position.y = 0;
    }

    createBasicMoon() {
        // Fallback method - same as createMoonGeometry
        this.createMoonGeometry();
    }


    async loadEarthModel() {
        const loader = new GLTFLoader();
        
        return new Promise((resolve, reject) => {
            const modelPath = '/assets/models/earth.glb';
            console.log('Loading Earth model from:', modelPath);
            
            loader.load(
                modelPath,
                (gltf) => {
                    console.log('Earth GLB model loaded - replacing fallback but keeping solid core');
                    const earth = gltf.scene;
                    
                    // Match the scale to our solid core (1.0 radius)
                    earth.scale.set(1, 1, 1);
                    earth.position.set(0, 0, 0); // Center at origin
                    earth.rotation.z = -23.4 * Math.PI / 180;
                    earth.name = 'Earth-GLB';
                    
                    // Remove fallback Earth geometry
                    if (this.models.earth && this.models.earth.name === 'Earth-Fallback') {
                        this.earthGroup.remove(this.models.earth);
                    }
                    
                    this.earthGroup.add(earth);
                    this.models.earth = earth;
                    
                    console.log('🌍 GLB Earth loaded - solid core remains for orbital mechanics');
                    
                    // Update solid core to match GLB dimensions if needed
                    if (this.models.earthCore) {
                        // GLB model scale is 1, so our core scale of 1 should match
                        console.log('🌌 Solid core matches GLB model dimensions');
                    }
                    
                    resolve(earth);
                },
                (progress) => {
                    console.log('Earth loading progress:', (progress.loaded / progress.total * 100) + '%');
                },
                (error) => {
                    console.warn('Earth GLB model not found, using geometry fallback with solid core:', error);
                    resolve(this.models.earth); // Use the geometry we already created
                }
            );
        });
    }

    async createProceduralEarth() {
        const detail = 32;
        const geometry = new THREE.IcosahedronGeometry(1, detail);
        
        try {
            // Load high-resolution textures
            const textureLoader = new THREE.TextureLoader();
            
            const [
                dayTexture,
                nightTexture,
                cloudTexture,
                bumpTexture,
                specularTexture
            ] = await Promise.all([
                this.loadTexture('./assets/textures/earth/day.jpg'),
                this.loadTexture('./assets/textures/earth/night.jpg'),
                this.loadTexture('./assets/textures/earth/clouds.jpg'),
                this.loadTexture('./assets/textures/earth/bump.jpg'),
                this.loadTexture('./assets/textures/earth/specular.jpg')
            ]);

            // Earth surface material
            const earthMaterial = new THREE.MeshPhongMaterial({
                map: dayTexture,
                bumpMap: bumpTexture,
                bumpScale: 0.05,
                specularMap: specularTexture,
                specular: new THREE.Color(0x333333),
                shininess: 25
            });

            const earthMesh = new THREE.Mesh(geometry, earthMaterial);
            earthMesh.castShadow = true;
            earthMesh.receiveShadow = true;
            this.earthGroup.add(earthMesh);

            // Night lights
            const lightsMaterial = new THREE.MeshBasicMaterial({
                map: nightTexture,
                blending: THREE.AdditiveBlending,
                transparent: true,
                opacity: 0.8
            });
            const lightsMesh = new THREE.Mesh(geometry, lightsMaterial);
            this.earthGroup.add(lightsMesh);

            // Clouds
            const cloudsMaterial = new THREE.MeshPhongMaterial({
                map: cloudTexture,
                transparent: true,
                opacity: 0.8,
                depthWrite: false
            });
            const cloudsMesh = new THREE.Mesh(geometry, cloudsMaterial);
            cloudsMesh.scale.setScalar(1.005);
            this.earthGroup.add(cloudsMesh);

            this.models.earth = earthMesh;
            this.models.lights = lightsMesh;
            this.models.clouds = cloudsMesh;

        } catch (error) {
            console.warn('Texture loading failed, using basic materials:', error);
            this.createBasicEarth(geometry);
        }
    }

    createBasicEarth(geometry) {
        const material = new THREE.MeshPhongMaterial({
            color: 0x2233ff,
            specular: 0x1188ff,
            shininess: 30
        });
        
        const earthMesh = new THREE.Mesh(geometry, material);
        earthMesh.castShadow = true;
        earthMesh.receiveShadow = true;
        this.earthGroup.add(earthMesh);
        
        this.models.earth = earthMesh;
    }

    createAtmosphere() {
        const geometry = new THREE.IcosahedronGeometry(1.02, 16);
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0x00aaff) },
                viewVector: { value: this.camera.position }
            },
            vertexShader: `
                uniform vec3 viewVector;
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    intensity = pow(0.7 - dot(vNormal, vNormel), 2.0);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;
                void main() {
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4(glow, intensity * 0.3);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });

        const atmosphere = new THREE.Mesh(geometry, material);
        this.earthGroup.add(atmosphere);
        this.models.atmosphere = atmosphere;
    }

    async setupEnvironment() {
        // No starfield - only Milky Way background
        // Moon is created in setupEarth()
    }


    async createMoon() {
        try {
            const loader = new GLTFLoader();
            
            return new Promise((resolve, reject) => {
                const moonPath = '/assets/models/moon.glb';
                console.log('Loading Moon model from:', moonPath);
                
                loader.load(
                    moonPath,
                    (gltf) => {
                        console.log('Moon model loaded successfully');
                        const moon = gltf.scene;
                        moon.scale.set(0.0027, 0.0027, 0.0027); // Scale to correct size relative to Earth
                        moon.position.set(2.5, 0, 0);
                        
                        moon.traverse((child) => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                            }
                        });
                        
                        this.earthGroup.add(moon);
                        this.models.moon = moon;
                        resolve(moon);
                    },
                    (progress) => {
                        console.log('Moon loading progress:', (progress.loaded / progress.total * 100) + '%');
                    },
                    (error) => {
                        console.warn('Moon model file not found, using fallback:', error);
                        // Don't reject, just create basic moon
                        this.createBasicMoon();
                        resolve(this.models.moon); // Resolve the promise with the fallback moon
                    }
                );
            });
        } catch (error) {
            console.warn('Moon model loading failed, using fallback:', error);
            this.createBasicMoon();
            return this.models.moon; // Return the fallback moon
        }
    }

    createBasicMoon() {
        const geometry = new THREE.SphereGeometry(0.27, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: 0x888888,
            bumpScale: 0.05,
            specular: new THREE.Color(0x111111),
            shininess: 10
        });
        
        const moon = new THREE.Mesh(geometry, material);
        moon.position.set(2.5, 0, 0);
        moon.castShadow = true;
        moon.receiveShadow = true;
        this.earthGroup.add(moon);
        this.models.moon = moon;
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 50;
        this.controls.maxPolarAngle = Math.PI; // Prevent going under the Earth
        
        // Smooth rotation
        this.controls.rotateSpeed = 0.5;
        this.controls.zoomSpeed = 0.8;
        this.controls.panSpeed = 0.5;
    }

    loadTexture(url) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.load(
                url,
                (texture) => {
                    texture.colorSpace = THREE.SRGBColorSpace;
                    texture.magFilter = THREE.LinearFilter;
                    texture.minFilter = THREE.LinearMipmapLinearFilter;
                    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
                    resolve(texture);
                },
                undefined,
                reject
            );
        });
    }

    update() {
        const delta = this.clock.getDelta();
        
        // Update FPS
        this.fps = 1 / delta;
        
        // Ensure Earth stays at origin for proper orbital mechanics
        this.ensureEarthCenter();
        
        // Ensure solid core stays at origin (critical for orbital mechanics)
        if (this.models.earthCore) {
            this.models.earthCore.position.set(0, 0, 0);
        }
        
        // Auto-rotate Earth
        if (this.autoRotate && this.earthGroup) {
            this.earthGroup.rotation.y += this.rotationSpeed;
        }
        
        // Rotate clouds slightly faster
        if (this.models.clouds) {
            this.models.clouds.rotation.y += this.cloudRotationSpeed;
        }
        
        // Update Moon orbit (simple orbit around Earth center at 0,0,0)
        if (this.models.moon && this.models.moon.userData.orbit) {
            const orbit = this.models.moon.userData.orbit;
            orbit.angle += orbit.speed;
            
            // Position Moon around Earth center (0,0,0)
            this.models.moon.position.x = Math.cos(orbit.angle) * orbit.radius;
            this.models.moon.position.z = Math.sin(orbit.angle) * orbit.radius;
            this.models.moon.position.y = 0; // Keep on same plane for now
        }
        
        // Update orbital mechanics for asteroids
        this.orbitalMechanics.update(delta);
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Update atmosphere shader
        if (this.models.atmosphere) {
            this.models.atmosphere.material.uniforms.viewVector.value = 
                new THREE.Vector3().subVectors(this.camera.position, this.models.atmosphere.position);
        }
    }

    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        } else {
            console.warn('⚠️ Render failed - missing components:', {
                renderer: !!this.renderer,
                scene: !!this.scene,
                camera: !!this.camera
            });
        }
    }

    handleResize() {
        if (!this.container) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        if (this.camera) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }
        
        if (this.renderer) {
            this.renderer.setSize(width, height);
        }
    }

    resetCamera() {
        if (this.controls) {
            this.controls.reset();
        }
    }

    toggleAutoRotate() {
        this.autoRotate = !this.autoRotate;
        return this.autoRotate;
    }

    setRotationSpeed(speed) {
        this.rotationSpeed = speed;
    }

    getFPS() {
        return Math.round(this.fps);
    }

    // Public methods for other components
    getScene() {
        return this.scene;
    }

    getCamera() {
        return this.camera;
    }

    addToScene(object) {
        this.scene.add(object);
    }

    removeFromScene(object) {
        this.scene.remove(object);
    }

    // Debug method to check what's in the scene
    debugScene() {
        console.log('🔍 Scene debug info:');
        console.log('  - Scene children:', this.scene.children.length);
        console.log('  - Earth group children:', this.earthGroup ? this.earthGroup.children.length : 'No earth group');
        console.log('  - Earth model:', this.models.earth ? 'Present' : 'Missing');
        console.log('  - Moon model:', this.models.moon ? 'Present' : 'Missing');
        
        if (this.models.earth) {
            console.log('  - Earth position:', this.models.earth.position);
            console.log('  - Earth visible:', this.models.earth.visible);
        }
        if (this.models.moon) {
            console.log('  - Moon position:', this.models.moon.position);
            console.log('  - Moon visible:', this.models.moon.visible);
        }
    }

    // Get the orbital mechanics system (for other components)
    getOrbitalMechanics() {
        return this.orbitalMechanics;
    }
    
    // Get Earth's center position (always origin)
    getEarthCenter() {
        return new THREE.Vector3(0, 0, 0);
    }
    
    // Get Earth's radius
    getEarthRadius() {
        return 1.0;
    }
    
    // Debug: Toggle visibility of solid Earth core
    toggleEarthCore(visible = null) {
        if (!this.models.earthCore) return false;
        
        if (visible === null) {
            // Toggle current state
            visible = !this.models.earthCore.visible;
        }
        
        this.models.earthCore.visible = visible;
        this.models.earthCore.material.opacity = visible ? 0.3 : 0;
        
        if (visible) {
            // Show as wireframe for debugging
            this.models.earthCore.material.wireframe = true;
            this.models.earthCore.material.color = new THREE.Color(0xff0000);
        }
        
        console.log(visible ? '🔴 Earth core visible (debug mode)' : '⚫ Earth core hidden (normal mode)');
        return visible;
    }
    
    // Create visible Moon orbit path
    createMoonOrbitPath(radius) {
        const points = [];
        const segments = 64;
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            ));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0xffffff, // White for Moon orbit
            transparent: true,
            opacity: 0.6,
            linewidth: 2
        });
        
        const moonOrbit = new THREE.Line(geometry, material);
        moonOrbit.name = 'moon-orbit';
        
        this.scene.add(moonOrbit);
        this.models.moonOrbit = moonOrbit;
        
        console.log('🌙 Moon orbit path created at radius', radius);
    }

    // Cleanup
    destroy() {
        if (this.orbitalMechanics) {
            this.orbitalMechanics.destroy();
        }
        if (this.controls) {
            this.controls.dispose();
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.container && this.renderer) {
            this.container.removeChild(this.renderer.domElement);
        }
    }
}

export { EarthGlobe };