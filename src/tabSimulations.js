// Tab Simulations Manager
// This module manages the 3D simulations for each tab in the application

import { DARTMission } from './dartMission.js';

class TabSimulations {
    constructor(mapboxGlobe) {
        this.mapboxGlobe = mapboxGlobe;
        this.map = mapboxGlobe.map;
        this.activeSimulation = null;
        this.simulations = {};
        this.currentTab = 'impact-analysis';
    }

    async initialize() {
        // Initialize all tab simulations
        await this.initializeImpactAnalysisSimulation();
        await this.initializeAsteroidsSimulation();
        await this.initializeDefenseSimulation();
        await this.initializeSimulationTabSimulation();
        
        // Set default simulation
        this.switchToSimulation('impact-analysis');
        
        return this;
    }

    async initializeImpactAnalysisSimulation() {
        // Impact Analysis tab simulation
        this.simulations['impact-analysis'] = {
            name: 'Impact Analysis',
            instance: new ImpactAnalysisSimulation(this.mapboxGlobe),
            active: false
        };
        
        await this.simulations['impact-analysis'].instance.initialize();
    }

    async initializeAsteroidsSimulation() {
        // Asteroids tab simulation
        this.simulations['asteroids'] = {
            name: 'Asteroid Database',
            instance: new AsteroidsSimulation(this.mapboxGlobe),
            active: false
        };
        
        await this.simulations['asteroids'].instance.initialize();
    }

    async initializeDefenseSimulation() {
        // Defense tab simulation - includes DART mission
        this.simulations['defense'] = {
            name: 'Defense Systems',
            instance: new DARTMission(this.mapboxGlobe),
            active: false
        };
        
        await this.simulations['defense'].instance.initialize();
    }

    async initializeSimulationTabSimulation() {
        // Simulation tab simulation
        this.simulations['simulation'] = {
            name: 'Impact Simulation',
            instance: new ImpactSimulation(this.mapboxGlobe),
            active: false
        };
        
        await this.simulations['simulation'].instance.initialize();
    }

    switchToSimulation(tabId) {
        // Deactivate current simulation
        if (this.activeSimulation) {
            this.activeSimulation.active = false;
            this.activeSimulation.instance.deactivate();
        }
        
        // Activate new simulation
        if (this.simulations[tabId]) {
            this.simulations[tabId].active = true;
            this.simulations[tabId].instance.activate();
            this.activeSimulation = this.simulations[tabId];
            this.currentTab = tabId;
        }
    }
}

// Impact Analysis Simulation
class ImpactAnalysisSimulation {
    constructor(mapboxGlobe) {
        this.mapboxGlobe = mapboxGlobe;
        this.map = mapboxGlobe.map;
        this.isActive = false;
        this.impactPoints = [];
    }

    async initialize() {
        // Set up impact visualization layers
        this.setupImpactLayers();
        return this;
    }

    setupImpactLayers() {
        // Add 3D impact beam visualization
        this.map.addLayer({
            id: 'impact-beams-3d',
            type: 'custom',
            renderingMode: '3d',
            onAdd: (map, gl) => {
                // Create impact beam geometries
                this.createImpactBeams(gl);
            },
            render: (gl, matrix) => {
                // Render impact beams
                this.renderImpactBeams(gl, matrix);
            }
        });
    }

    createImpactBeams(gl) {
        // Create sample impact points
        this.impactPoints = [
            { location: [-122.4194, 37.7749], height: 50, color: [1.0, 0.2, 0.2] }, // San Francisco
            { location: [-74.0060, 40.7128], height: 40, color: [1.0, 0.5, 0.2] },  // New York
            { location: [2.3522, 48.8566], height: 45, color: [1.0, 0.3, 0.3] }     // Paris
        ];
    }

    renderImpactBeams(gl, matrix) {
        // In a real implementation, we would render 3D beams here
        // For now, we'll just log that rendering would happen
        console.log('Rendering impact beams');
    }

    activate() {
        this.isActive = true;
        
        // Set appropriate camera view
        this.map.flyTo({
            center: [-50, 30],
            zoom: 1.5,
            pitch: 45,
            bearing: 0,
            duration: 2000
        });
        
        // Show impact layers
        if (this.map.getLayer('impact-beams-3d')) {
            this.map.setLayoutProperty('impact-beams-3d', 'visibility', 'visible');
        }
    }

    deactivate() {
        this.isActive = false;
        
        // Hide impact layers
        if (this.map.getLayer('impact-beams-3d')) {
            this.map.setLayoutProperty('impact-beams-3d', 'visibility', 'none');
        }
    }
}

// Asteroids Simulation
import { asteroidDataService } from './asteroidData.js';

class AsteroidsSimulation {
    constructor(mapboxGlobe) {
        this.mapboxGlobe = mapboxGlobe;
        this.map = mapboxGlobe.map;
        this.isActive = false;
        this.asteroids = [];
        this.animationFrame = null;
        this.lastUpdateTime = 0;
        this.orbitPaths = [];
    }

    async initialize() {
        // Load asteroid data from Supabase
        await this.loadAsteroidData();
        
        // Load asteroid models
        await this.loadAsteroidModels();
        return this;
    }
    
    async loadAsteroidData() {
        try {
            // Fetch asteroid data from Supabase
            await asteroidDataService.fetchAsteroidData(15);
            this.asteroids = asteroidDataService.asteroidData;
            console.log('Loaded asteroid data:', this.asteroids.length, 'asteroids');
        } catch (error) {
            console.error('Failed to load asteroid data:', error);
            // Fallback to sample data if API fails
            this.createSampleAsteroids();
        }
    }

    async loadAsteroidModels() {
        // Add a custom layer for asteroid visualization
        this.map.addLayer({
            id: 'asteroids-3d',
            type: 'custom',
            renderingMode: '3d',
            onAdd: (map, gl) => {
                // Create asteroid orbit paths
                this.createOrbitPaths();
            },
            render: (gl, matrix) => {
                // Render asteroids
                this.renderAsteroids(gl, matrix);
            }
        });
        
        // Hide layer initially
        this.map.setLayoutProperty('asteroids-3d', 'visibility', 'none');
    }
    
    createOrbitPaths() {
        // Create orbit path visualizations for each asteroid
        this.orbitPaths = this.asteroids.map(asteroid => {
            const { radius, inclination } = asteroid.orbitData;
            
            // Create points along the orbit path
            const pathPoints = [];
            const segments = 64;
            
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const position = asteroidDataService.calculatePositionFromOrbit(
                    radius, angle, inclination
                );
                pathPoints.push(position);
            }
            
            return {
                asteroidId: asteroid.id,
                points: pathPoints,
                color: this.getAsteroidColor(asteroid.type)
            };
        });
    }
    
    getAsteroidColor(type) {
        switch (type) {
            case 'carbon': return [0.2, 0.2, 0.2]; // Dark gray
            case 'rock': return [0.6, 0.4, 0.2];   // Brown
            case 'metal': return [0.7, 0.7, 0.8];  // Silver
            default: return [0.5, 0.5, 0.5];       // Gray
        }
    }

    createSampleAsteroids() {
        // Create sample asteroids as fallback
        this.asteroids = [
            { 
                id: 'bennu',
                name: 'Bennu',
                position: [20, 10, 0],
                rotation: [0, 0, 0],
                scale: 0.02,
                velocity: [0.01, 0.005, 0],
                type: 'carbon',
                orbitData: {
                    radius: 20,
                    speed: 0.005,
                    inclination: 0.2,
                    currentAngle: 0
                }
            },
            { 
                id: 'apophis',
                name: 'Apophis',
                position: [-15, 5, 0],
                rotation: [0, 0, 0],
                scale: 0.015,
                velocity: [0.008, -0.003, 0],
                type: 'rock',
                orbitData: {
                    radius: 15,
                    speed: 0.008,
                    inclination: -0.1,
                    currentAngle: Math.PI
                }
            },
            { 
                id: 'psyche',
                name: 'Psyche',
                position: [0, -20, 0],
                rotation: [0, 0, 0],
                scale: 0.025,
                velocity: [-0.005, 0.01, 0],
                type: 'metal',
                orbitData: {
                    radius: 20,
                    speed: 0.006,
                    inclination: 0.3,
                    currentAngle: Math.PI / 2
                }
            }
        ];
    }

    renderAsteroids(gl, matrix) {
        // Update asteroid positions
        if (this.isActive) {
            const currentTime = Date.now();
            const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
            this.lastUpdateTime = currentTime;
            
            this.updateAsteroidPositions(deltaTime);
        }
        
        // In a real implementation, we would render 3D asteroids here
        // For now, we'll just log that rendering would happen
        console.log('Rendering asteroids with real orbit data');
    }

    updateAsteroidPositions(deltaTime = 0.016) {
        // Use the asteroid data service to update positions based on orbital mechanics
        this.asteroids = asteroidDataService.updateAsteroidPositions(deltaTime);
        
        // Trigger map render update
        this.map.triggerRepaint();
    }

    activate() {
        this.isActive = true;
        this.lastUpdateTime = Date.now();
        
        // Set appropriate camera view for orbit visualization
        this.map.flyTo({
            center: [0, 0],
            zoom: 2.5,
            pitch: 75,  // Higher pitch to better see orbits
            bearing: 15,
            duration: 2000
        });
        
        // Show asteroid layers
        if (this.map.getLayer('asteroids-3d')) {
            this.map.setLayoutProperty('asteroids-3d', 'visibility', 'visible');
        }
        
        // Start animation
        this.startAnimation();
        
        // Refresh asteroid data if it's been a while
        const timeSinceLastFetch = asteroidDataService.lastFetchTime ? 
            (Date.now() - asteroidDataService.lastFetchTime) / 1000 / 60 : 999;
            
        if (timeSinceLastFetch > 5) {  // Refresh if older than 5 minutes
            this.loadAsteroidData().then(() => {
                this.createOrbitPaths();
            });
        }
    }

    deactivate() {
        this.isActive = false;
        
        // Hide asteroid layers
        if (this.map.getLayer('asteroids-3d')) {
            this.map.setLayoutProperty('asteroids-3d', 'visibility', 'none');
        }
        
        // Stop animation
        this.stopAnimation();
    }

    startAnimation() {
        if (this.animationFrame) return;
        
        const animate = () => {
            if (!this.isActive) return;
            
            // Update asteroid positions
            this.updateAsteroidPositions();
            
            // Request next frame
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        this.animationFrame = requestAnimationFrame(animate);
    }

    stopAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
}

// Impact Simulation
class ImpactSimulation {
    constructor(mapboxGlobe) {
        this.mapboxGlobe = mapboxGlobe;
        this.map = mapboxGlobe.map;
        this.isActive = false;
        this.simulationRunning = false;
        this.impactLocation = [-100, 40];
        this.asteroidSize = 1.0;
        this.impactVelocity = 25;
    }

    async initialize() {
        // Set up impact simulation layers
        this.setupSimulationLayers();
        return this;
    }

    setupSimulationLayers() {
        // Add 3D impact simulation layer
        this.map.addLayer({
            id: 'impact-simulation-3d',
            type: 'custom',
            renderingMode: '3d',
            onAdd: (map, gl) => {
                // Create impact simulation geometries
                this.createSimulationGeometries(gl);
            },
            render: (gl, matrix) => {
                // Render impact simulation
                this.renderSimulation(gl, matrix);
            }
        });
        
        // Hide layer initially
        this.map.setLayoutProperty('impact-simulation-3d', 'visibility', 'none');
    }

    createSimulationGeometries(gl) {
        // Create simulation geometries
        // In a real implementation, we would create WebGL geometries here
    }

    renderSimulation(gl, matrix) {
        // In a real implementation, we would render the impact simulation here
        // For now, we'll just log that rendering would happen
        if (this.simulationRunning) {
            console.log('Rendering impact simulation');
        }
    }

    runSimulation(asteroidSize, velocity, location) {
        this.asteroidSize = asteroidSize || this.asteroidSize;
        this.impactVelocity = velocity || this.impactVelocity;
        this.impactLocation = location || this.impactLocation;
        
        this.simulationRunning = true;
        
        // In a real implementation, we would start the simulation here
        console.log(`Running impact simulation with asteroid size: ${this.asteroidSize}km, velocity: ${this.impactVelocity}km/s`);
        
        // Trigger map render update
        this.map.triggerRepaint();
    }

    stopSimulation() {
        this.simulationRunning = false;
    }

    activate() {
        this.isActive = true;
        
        // Set appropriate camera view
        this.map.flyTo({
            center: this.impactLocation,
            zoom: 3,
            pitch: 60,
            bearing: 0,
            duration: 2000
        });
        
        // Show simulation layers
        if (this.map.getLayer('impact-simulation-3d')) {
            this.map.setLayoutProperty('impact-simulation-3d', 'visibility', 'visible');
        }
    }

    deactivate() {
        this.isActive = false;
        
        // Stop any running simulation
        this.stopSimulation();
        
        // Hide simulation layers
        if (this.map.getLayer('impact-simulation-3d')) {
            this.map.setLayoutProperty('impact-simulation-3d', 'visibility', 'none');
        }
    }
}

export { TabSimulations };