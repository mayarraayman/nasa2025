import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RealtimeAsteroidService } from './realtimeAsteroidService.js';
import { AsteroidMLPredictor } from './asteroidMLPredictor.js';

class AsteroidManager {
    constructor(scene, orbitalMechanics = null) {
        this.scene = scene;
        this.orbitalMechanics = orbitalMechanics;
        this.asteroids = new Map();
        this.asteroidGroup = new THREE.Group();
        this.orbitsGroup = new THREE.Group();
        this.highlightedAsteroid = null;
        
        this.asteroidModels = {};
        this.orbitalData = new Map(); // Keep for backward compatibility
        
        // Real-time data services
        this.realtimeService = new RealtimeAsteroidService();
        this.mlPredictor = new AsteroidMLPredictor();
        
        // Real-time subscriptions
        this.dataSubscription = null;
        
        this.scene.add(this.asteroidGroup);
        this.scene.add(this.orbitsGroup);
        
        console.log('☄️ AsteroidManager initialized with:', {
            orbitalMechanics: !!this.orbitalMechanics,
            realtimeService: true,
            mlPredictor: true
        });
    }

    async initialize() {
        console.log('🚀 Initializing Asteroid Manager with real data...');
        
        // Initialize ML predictor
        await this.mlPredictor.initialize();
        
        // Initialize real-time service
        await this.realtimeService.initialize();
        
        // Set up real-time data subscription
        this.dataSubscription = this.realtimeService.subscribe((update) => {
            this.handleRealtimeUpdate(update);
        });
        
        // Load asteroid models
        await this.loadAsteroidModels();
        
        // Load ONLY real asteroid data from Supabase (NO SAMPLE DATA)
        await this.loadRealAsteroidData();
        
        console.log('☄️ Asteroid manager initialized with real-time data and ML predictions');
    }

    // REMOVED: No longer creating fake sample asteroids
    // All asteroids now come from real Supabase data only

    update() {
        // Update ONLY real asteroids from Supabase data with ML predictions
        this.asteroids.forEach(asteroid => {
            if (asteroid.userData && asteroid.userData.isRealAsteroid) {
                // Update real asteroid orbital mechanics if available
                if (asteroid.userData.orbit) {
                    const orbit = asteroid.userData.orbit;
                    orbit.angle += orbit.speed;
                    asteroid.position.x = Math.cos(orbit.angle) * orbit.radius;
                    asteroid.position.z = Math.sin(orbit.angle) * orbit.radius;
                }
                
                // Realistic asteroid rotation
                asteroid.rotation.x += 0.002;
                asteroid.rotation.y += 0.003;
                asteroid.rotation.z += 0.001;
                
                // Update risk visualization based on ML predictions
                if (asteroid.userData.mlPrediction && asteroid.userData.riskGlow) {
                    // Pulse high-risk asteroids
                    if (asteroid.userData.mlPrediction.riskLevel === 'CRITICAL') {
                        const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 0.5;
                        asteroid.userData.riskGlow.material.opacity = pulse;
                    }
                }
            }
        });
    }

    // REMOVED: No longer creating sample orbital asteroids
    
    // REMOVED: No longer using fallback asteroid creation
    
    // REMOVED: No longer creating fallback orbital asteroids

    async loadAsteroidModels() {
        const loader = new GLTFLoader();
        const modelTypes = ['rock', 'metal', 'carbon'];
        
        for (const type of modelTypes) {
            try {
                const modelPath = `/assets/models/asteroid_${type}.glb`;
                console.log(`Loading ${type} asteroid model from:`, modelPath);
                
                const gltf = await new Promise((resolve, reject) => {
                    loader.load(
                        modelPath,
                        (gltf) => {
                            console.log(`✅ Loaded ${type} asteroid model successfully`);
                            resolve(gltf);
                        },
                        (progress) => {
                            console.log(`${type} loading progress:`, (progress.loaded / progress.total * 100) + '%');
                        },
                        (error) => {
                            console.error(`Error loading ${type} asteroid model:`, error);
                            reject(error);
                        }
                    );
                });
                
                this.asteroidModels[type] = gltf.scene;
                
            } catch (error) {
                console.warn(`Failed to load ${type} asteroid model, using fallback:`, error);
                this.asteroidModels[type] = this.createFallbackAsteroid(type);
            }
        }
    }

    createFallbackAsteroid(type) {
        const geometry = new THREE.IcosahedronGeometry(1, 1);
        
        const materials = {
            rock: new THREE.MeshPhongMaterial({ 
                color: 0x8B7355,
                bumpScale: 0.1,
                shininess: 10
            }),
            metal: new THREE.MeshPhongMaterial({ 
                color: 0x888888,
                specular: 0x222222,
                shininess: 50
            }),
            carbon: new THREE.MeshPhongMaterial({ 
                color: 0x333333,
                specular: 0x111111,
                shininess: 5
            })
        };
        
        const mesh = new THREE.Mesh(geometry, materials[type] || materials.rock);
        return mesh;
    }
    
    // This creates basic asteroid meshes from GLB models or fallback
    createBasicAsteroid(type) {
        // Use loaded GLB model if available, otherwise fallback
        if (this.asteroidModels[type]) {
            return this.asteroidModels[type].clone();
        } else {
            console.warn(`Asteroid model ${type} not loaded, using fallback`);
            return this.createFallbackAsteroid(type);
        }
    }

    loadAsteroids(asteroidData) {
        // Don't clear existing orbital asteroids, just add new ones
        console.log('📡 Loading real asteroid data...');
        
        asteroidData.forEach((data, index) => {
            this.createAsteroid(data, index);
        });
        
        console.log(`✅ Loaded ${asteroidData.length} real asteroids`);
        console.log(`☄️ Total asteroids now: ${this.asteroidGroup.children.length}`);
    }

    createAsteroid(data, index) {
        const asteroid = this.createAsteroidMesh(data);
        this.setupOrbit(asteroid, data);
        this.setupAsteroidProperties(asteroid, data);
        
        this.asteroids.set(data.id, asteroid);
        this.asteroidGroup.add(asteroid);
        
        return asteroid;
    }

    createAsteroidMesh(data) {
        const modelType = this.getAsteroidType(data.composition);
        const baseModel = this.asteroidModels[modelType];
        
        const asteroid = baseModel.clone();
        
        // Scale based on diameter (convert km to appropriate scale)
        const scale = data.diameter * 0.1; // Adjust scale factor as needed
        asteroid.scale.set(scale, scale, scale);
        
        // Random rotation
        asteroid.rotation.x = Math.random() * Math.PI;
        asteroid.rotation.y = Math.random() * Math.PI;
        asteroid.rotation.z = Math.random() * Math.PI;
        
        // Add clickable functionality
        asteroid.userData = {
            isAsteroid: true,
            asteroidData: data,
            originalScale: scale
        };
        
        return asteroid;
    }

    getAsteroidType(composition) {
        const typeMap = {
            'stony': 'rock',
            'iron': 'metal', 
            'carbonaceous': 'carbon',
            'metal': 'metal',
            'rock': 'rock'
        };
        
        return typeMap[composition?.toLowerCase()] || 'rock';
    }

    setupOrbit(asteroid, data) {
        if (!data.orbit) return;
        
        // If we have orbital mechanics, use it for real asteroids
        if (this.orbitalMechanics && data.id) {
            this.orbitalMechanics.registerOrbitalBody(data.id, asteroid, {
                semiMajorAxis: data.orbit.semiMajorAxis || 10,
                eccentricity: data.orbit.eccentricity || 0.1,
                inclination: data.orbit.inclination || 0,
                orbitalPeriod: data.orbit.orbitalPeriod || 500,
                trueAnomaly: Math.random() * Math.PI * 2
            });
            
            // Create visual orbit path
            const orbitLine = this.orbitalMechanics.createOrbitPath(data.id);
            if (orbitLine) {
                this.orbitsGroup.add(orbitLine);
            }
        } else {
            // Fallback: create manual orbital path
            const orbitGeometry = new THREE.BufferGeometry();
            const orbitPoints = this.calculateOrbitPoints(data.orbit);
            orbitGeometry.setFromPoints(orbitPoints);
            
            const orbitMaterial = new THREE.LineBasicMaterial({
                color: 0x4444ff,
                transparent: true,
                opacity: 0.3,
                linewidth: 1
            });
            
            const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
            this.orbitsGroup.add(orbit);
            
            // Store orbital data for animation
            this.orbitalData.set(data.id, {
                orbitPoints,
                speed: data.orbit.speed || 0.001,
                currentAngle: Math.random() * Math.PI * 2
            });
        }
    }

    calculateOrbitPoints(orbitData) {
        const points = [];
        const segments = 64;
        
        const semiMajorAxis = orbitData.semiMajorAxis || 10;
        const eccentricity = orbitData.eccentricity || 0.1;
        const inclination = orbitData.inclination || 0;
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const radius = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(angle));
            
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            const y = z * Math.sin(inclination);
            
            points.push(new THREE.Vector3(x, y, z));
        }
        
        return points;
    }

    setupAsteroidProperties(asteroid, data) {
        // Add glow effect for selected asteroid
        const glowGeometry = new THREE.SphereGeometry(1.2, 8, 6);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0,
            side: THREE.BackSide
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        asteroid.add(glow);
        asteroid.userData.glow = glow;
        
        // Add label
        this.createAsteroidLabel(asteroid, data);
    }

    createAsteroidLabel(asteroid, data) {
        // This would create a CSS2D or CSS3D label
        // For now, we'll store the data for UI display
        asteroid.userData.label = data.name;
    }

    // Remove duplicate update method - it's already defined above

    updateAsteroidPosition(asteroid, id) {
        // If using orbital mechanics, positioning is handled automatically
        if (this.orbitalMechanics && this.orbitalMechanics.getOrbitalData(id)) {
            return; // Orbital mechanics handles this
        }
        
        // Fallback: manual position update
        const orbitData = this.orbitalData.get(id);
        if (!orbitData) return;
        
        orbitData.currentAngle += orbitData.speed;
        const pointIndex = Math.floor((orbitData.currentAngle / (Math.PI * 2)) * orbitData.orbitPoints.length);
        const point = orbitData.orbitPoints[pointIndex % orbitData.orbitPoints.length];
        
        asteroid.position.copy(point);
    }

    highlightAsteroid(asteroidId) {
        // Remove previous highlight
        if (this.highlightedAsteroid) {
            this.removeHighlight(this.highlightedAsteroid);
        }
        
        const asteroid = this.asteroids.get(asteroidId);
        if (!asteroid) return;
        
        // Add highlight effect
        if (asteroid.userData.glow) {
            asteroid.userData.glow.material.opacity = 0.3;
        }
        
        // Scale up slightly
        asteroid.scale.multiplyScalar(1.2);
        
        this.highlightedAsteroid = asteroidId;
    }

    removeHighlight(asteroidId) {
        const asteroid = this.asteroids.get(asteroidId);
        if (!asteroid) return;
        
        if (asteroid.userData.glow) {
            asteroid.userData.glow.material.opacity = 0;
        }
        
        // Reset scale
        asteroid.scale.setScalar(asteroid.userData.originalScale);
    }

    getAsteroidById(id) {
        return this.asteroids.get(id);
    }

    getAsteroids() {
        return Array.from(this.asteroids.values()).map(asteroid => asteroid.userData.asteroidData);
    }

    getAsteroidCount() {
        return this.asteroids.size;
    }

    clearAsteroids() {
        this.asteroids.forEach(asteroid => {
            this.asteroidGroup.remove(asteroid);
        });
        this.asteroids.clear();
        
        this.orbitsGroup.clear();
        this.orbitalData.clear();
        
        this.highlightedAsteroid = null;
    }

    // Raycasting for asteroid selection
    setupRaycaster(camera, domElement) {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.camera = camera;
        
        domElement.addEventListener('click', (event) => {
            this.handleAsteroidClick(event);
        });
    }

    handleAsteroidClick(event) {
        if (!this.raycaster || !this.camera) return;
        
        const rect = this.raycaster.camera.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        const asteroids = Array.from(this.asteroids.values());
        const intersects = this.raycaster.intersectObjects(asteroids);
        
        if (intersects.length > 0) {
            const asteroid = intersects[0].object;
            this.onAsteroidSelected(asteroid.userData.asteroidData);
        }
    }

    onAsteroidSelected(asteroidData) {
        // This will be connected to the main app
        if (this.selectionCallback) {
            this.selectionCallback(asteroidData);
        }
    }

    setSelectionCallback(callback) {
        this.selectionCallback = callback;
    }

    toggleOrbitsVisibility(visible) {
        this.orbitsGroup.visible = visible;
    }

    toggleLabelsVisibility(visible) {
        // Implementation for toggling asteroid labels
        console.log('Labels visibility:', visible);
    }

    // REMOVED: Sample orbit paths no longer needed
    // Real asteroid orbits are handled by orbital mechanics system
    
    // Toggle visibility of orbital paths
    toggleOrbitPaths(visible = null) {
        if (visible === null) {
            visible = !this.orbitsGroup.visible;
        }
        this.orbitsGroup.visible = visible;
        console.log(`🌌 Orbit paths ${visible ? 'shown' : 'hidden'}`);
        return visible;
    }

    /**
     * Load real asteroid data from Supabase
     */
    async loadRealAsteroidData() {
        try {
            console.log('📊 Loading ONLY real asteroid data from Supabase (NO SAMPLE DATA)...');
            
            // Get high-priority asteroids (hazardous or approaching soon)
            const realAsteroids = await this.realtimeService.getHighPriorityAsteroids();
            
            if (realAsteroids.length === 0) {
                console.warn('⚠️ No real asteroid data found in Supabase database');
                console.log('⚠️ Please check your Supabase connection and asteroid data');
                console.log('⚠️ NO SAMPLE DATA WILL BE GENERATED - only real data is used');
                return;
            }
            
            console.log(`📊 Found ${realAsteroids.length} real asteroids in database`);
            
            // Get ML predictions for all asteroids
            const predictions = await this.mlPredictor.predictBatchRisks(realAsteroids);
            
            // Create 3D representations of real asteroids
            realAsteroids.forEach((asteroid, index) => {
                const prediction = predictions[index];
                this.createRealAsteroid(asteroid, prediction);
            });
            
            console.log(`✅ SUCCESS: Created ${realAsteroids.length} real asteroids with ML predictions`);
            console.log(`☄️ All asteroids are real NASA data - NO SAMPLE/FAKE DATA`);
            
        } catch (error) {
            console.error('❌ Error loading real asteroid data:', error);
            console.error('❌ NO FALLBACK DATA - only real Supabase data is used');
        }
    }
    
    /**
     * Create 3D representation of real asteroid with ML prediction
     */
    createRealAsteroid(asteroidData, mlPrediction) {
        // Create asteroid mesh
        const asteroid = this.createBasicAsteroid(asteroidData.composition);
        
        // Scale based on actual diameter
        const scale = Math.max(0.05, Math.min(0.3, asteroidData.diameter.average * 0.5));
        asteroid.scale.set(scale, scale, scale);
        
        // Position based on orbital parameters
        if (asteroidData.orbit) {
            asteroid.position.set(
                asteroidData.orbit.semiMajorAxis * Math.cos(Math.random() * Math.PI * 2),
                (Math.random() - 0.5) * 2,
                asteroidData.orbit.semiMajorAxis * Math.sin(Math.random() * Math.PI * 2)
            );
            
            // Store orbit data for animation
            asteroid.userData.orbit = {
                radius: asteroidData.orbit.semiMajorAxis,
                angle: Math.random() * Math.PI * 2,
                speed: asteroidData.orbit.speed
            };
        }
        
        // Add ML prediction data and risk visualization
        asteroid.userData = {
            ...asteroid.userData,
            isRealAsteroid: true,
            asteroidData: asteroidData,
            mlPrediction: mlPrediction,
            riskLevel: mlPrediction.riskLevel,
            originalScale: scale
        };
        
        // Add risk-based visual effects
        this.addRiskVisualization(asteroid, mlPrediction);
        
        // Add to scene and registry
        this.scene.add(asteroid);
        this.asteroids.set(asteroidData.id, asteroid);
        
        console.log(`🎆 Created real asteroid: ${asteroidData.name} (Risk: ${mlPrediction.riskLevel})`);
    }
    
    /**
     * Add risk-based visual effects to asteroid
     */
    addRiskVisualization(asteroid, mlPrediction) {
        // Color coding based on risk level
        const riskColors = {
            'CRITICAL': 0xff0000,  // Red
            'HIGH': 0xff6600,      // Orange-Red
            'MEDIUM': 0xffaa00,    // Orange
            'LOW': 0xffff00,       // Yellow
            'MINIMAL': 0x00ff00    // Green
        };
        
        const riskColor = riskColors[mlPrediction.riskLevel] || 0xffffff;
        
        // Add glowing outline for high-risk asteroids
        if (mlPrediction.riskLevel === 'CRITICAL' || mlPrediction.riskLevel === 'HIGH') {
            const glowGeometry = new THREE.SphereGeometry(1.3, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: riskColor,
                transparent: true,
                opacity: 0.3,
                side: THREE.BackSide
            });
            
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            asteroid.add(glow);
            asteroid.userData.riskGlow = glow;
        }
        
        // Update asteroid material color based on risk
        asteroid.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.emissive = new THREE.Color(riskColor);
                child.material.emissiveIntensity = mlPrediction.risk * 0.3;
            }
        });
    }
    
    /**
     * Handle real-time data updates
     */
    handleRealtimeUpdate(update) {
        console.log('📡 Real-time asteroid update:', update.type);
        
        switch (update.type) {
            case 'INSERT':
                // New asteroid detected
                this.handleNewAsteroid(update.data);
                break;
            case 'UPDATE':
                // Asteroid data updated
                this.handleAsteroidUpdate(update.data);
                break;
            case 'DELETE':
                // Asteroid removed
                this.handleAsteroidRemoval(update.data);
                break;
        }
    }
    
    /**
     * Handle new asteroid detection
     */
    async handleNewAsteroid(asteroidData) {
        console.log('🆕 New asteroid detected:', asteroidData.name);
        
        // Process the new data
        const processedData = this.realtimeService.processNEOData([asteroidData])[0];
        
        // Get ML prediction
        const prediction = await this.mlPredictor.predictImpactRisk(processedData);
        
        // Create 3D representation
        this.createRealAsteroid(processedData, prediction);
        
        // Trigger alert if high risk
        if (prediction.riskLevel === 'CRITICAL' || prediction.riskLevel === 'HIGH') {
            this.triggerHighRiskAlert(processedData, prediction);
        }
    }
    
    /**
     * Handle asteroid data updates
     */
    async handleAsteroidUpdate(asteroidData) {
        const existingAsteroid = this.asteroids.get(asteroidData.neo_id);
        if (existingAsteroid) {
            // Update ML prediction with new data
            const processedData = this.realtimeService.processNEOData([asteroidData])[0];
            const prediction = await this.mlPredictor.predictImpactRisk(processedData);
            
            // Update visual representation
            existingAsteroid.userData.asteroidData = processedData;
            existingAsteroid.userData.mlPrediction = prediction;
            this.addRiskVisualization(existingAsteroid, prediction);
            
            console.log(`🔄 Updated asteroid: ${processedData.name}`);
        }
    }
    
    /**
     * Handle asteroid removal
     */
    handleAsteroidRemoval(asteroidData) {
        const asteroid = this.asteroids.get(asteroidData.neo_id);
        if (asteroid) {
            this.scene.remove(asteroid);
            this.asteroids.delete(asteroidData.neo_id);
            console.log(`🗑️ Removed asteroid: ${asteroidData.name}`);
        }
    }
    
    /**
     * Trigger high-risk asteroid alert
     */
    triggerHighRiskAlert(asteroidData, prediction) {
        console.warn('🚨 HIGH RISK ASTEROID DETECTED:', {
            name: asteroidData.name,
            riskLevel: prediction.riskLevel,
            confidence: prediction.confidence,
            factors: prediction.factors
        });
        
        // You can integrate with your UI alert system here
        if (window.oblivara && window.oblivara.components.ui) {
            window.oblivara.components.ui.addAlert(
                'critical',
                'High Risk Asteroid Detected',
                `${asteroidData.name} - Risk Level: ${prediction.riskLevel}`
            );
        }
    }
    
    /**
     * Get real-time statistics
     */
    getRealTimeStats() {
        const realAsteroids = Array.from(this.asteroids.values())
            .filter(a => a.userData.isRealAsteroid);
            
        const riskLevels = realAsteroids.reduce((acc, asteroid) => {
            const level = asteroid.userData.riskLevel || 'UNKNOWN';
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {});
        
        return {
            totalReal: realAsteroids.length,
            totalOrbital: this.asteroidGroup.children.length,
            riskDistribution: riskLevels,
            mlModelInfo: this.mlPredictor.getModelInfo(),
            connectionStatus: this.realtimeService.isConnected
        };
    }

    // Cleanup
    destroy() {
        // Unsubscribe from real-time updates
        if (this.dataSubscription) {
            this.dataSubscription();
        }
        
        // Destroy services
        if (this.realtimeService) {
            this.realtimeService.destroy();
        }
        
        if (this.mlPredictor) {
            this.mlPredictor.destroy();
        }
        
        this.clearAsteroids();
        this.scene.remove(this.asteroidGroup);
        this.scene.remove(this.orbitsGroup);
        
        console.log('🧹 AsteroidManager destroyed');
    }
}

export { AsteroidManager };