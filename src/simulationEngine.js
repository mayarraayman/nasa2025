import * as THREE from 'three';

class SimulationEngine {
    constructor(app) {
        this.app = app;
        this.isRunning = false;
        this.simulationTime = 0;
        this.impactResult = null;
        
        this.visualization = {
            impactCrater: null,
            shockwave: null,
            debris: null
        };
    }

    start(parameters) {
        this.isRunning = true;
        this.simulationTime = 0;
        this.parameters = parameters;
        
        this.initializeVisualization();
        this.calculateImpact();
        
        console.log('💥 Simulation started with parameters:', parameters);
    }

    stop() {
        this.isRunning = false;
        this.cleanupVisualization();
        console.log('⏹️ Simulation stopped');
    }

    update() {
        if (!this.isRunning) return;
        
        this.simulationTime += 0.016; // Assuming 60 FPS
        
        this.updateVisualization();
        
        // End simulation after 10 seconds
        if (this.simulationTime > 10) {
            this.stop();
        }
    }

    initializeVisualization() {
        const earth = this.app.getEarthGlobe();
        if (!earth) return;
        
        this.createImpactCrater();
        this.createShockwave();
        this.createDebrisField();
    }

    createImpactCrater() {
        const craterGeometry = new THREE.CylinderGeometry(0.5, 1, 0.2, 32);
        const craterMaterial = new THREE.MeshPhongMaterial({
            color: 0x8B4513,
            transparent: true,
            opacity: 0.8
        });
        
        this.visualization.impactCrater = new THREE.Mesh(craterGeometry, craterMaterial);
        
        // Position on Earth surface (simplified)
        const impactPoint = this.calculateImpactPoint();
        this.visualization.impactCrater.position.copy(impactPoint);
        
        this.app.getEarthGlobe().addToScene(this.visualization.impactCrater);
    }

    createShockwave() {
        const shockwaveGeometry = new THREE.RingGeometry(0.1, 1, 32);
        const shockwaveMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4500,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        
        this.visualization.shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
        this.visualization.shockwave.rotation.x = Math.PI / 2;
        
        const impactPoint = this.calculateImpactPoint();
        this.visualization.shockwave.position.copy(impactPoint);
        
        this.app.getEarthGlobe().addToScene(this.visualization.shockwave);
    }

    createDebrisField() {
        const debrisGroup = new THREE.Group();
        const debrisCount = 50;
        
        for (let i = 0; i < debrisCount; i++) {
            const debrisGeometry = new THREE.SphereGeometry(0.02, 8, 8);
            const debrisMaterial = new THREE.MeshBasicMaterial({
                color: 0xff6b35,
                transparent: true,
                opacity: 0.8
            });
            
            const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
            
            // Random position around impact point
            const angle = Math.random() * Math.PI * 2;
            const distance = 0.5 + Math.random() * 2;
            debris.position.set(
                Math.cos(angle) * distance,
                Math.random() * 0.5,
                Math.sin(angle) * distance
            );
            
            // Random velocity
            debris.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                Math.random() * 0.2,
                (Math.random() - 0.5) * 0.1
            );
            
            debrisGroup.add(debris);
        }
        
        const impactPoint = this.calculateImpactPoint();
        debrisGroup.position.copy(impactPoint);
        
        this.visualization.debris = debrisGroup;
        this.app.getEarthGlobe().addToScene(debrisGroup);
    }

    calculateImpactPoint() {
        // Simplified - in real implementation, use the actual impact location
        return new THREE.Vector3(1, 0, 0); // Surface point
    }

    updateVisualization() {
        if (this.visualization.shockwave) {
            // Expand shockwave
            const scale = 1 + this.simulationTime * 2;
            this.visualization.shockwave.scale.set(scale, scale, scale);
            this.visualization.shockwave.material.opacity = 0.6 - this.simulationTime * 0.1;
        }
        
        if (this.visualization.debris) {
            // Move debris particles
            this.visualization.debris.children.forEach(debris => {
                debris.position.add(debris.userData.velocity);
                debris.userData.velocity.y -= 0.01; // Gravity
                
                // Fade out
                debris.material.opacity = 0.8 - this.simulationTime * 0.1;
            });
        }
    }

    cleanupVisualization() {
        const earth = this.app.getEarthGlobe();
        if (!earth) return;
        
        Object.values(this.visualization).forEach(obj => {
            if (obj) {
                earth.removeFromScene(obj);
            }
        });
        
        this.visualization = {
            impactCrater: null,
            shockwave: null,
            debris: null
        };
    }

    calculateImpact() {
        if (!this.parameters) return;
        
        // Simplified impact calculations
        const energy = this.calculateEnergy();
        const craterSize = this.calculateCraterSize(energy);
        const affectedPopulation = this.estimateAffectedPopulation(craterSize);
        const economicImpact = this.estimateEconomicImpact(affectedPopulation, craterSize);
        
        this.impactResult = {
            energy: this.formatEnergy(energy),
            crater: `${craterSize.toFixed(1)} km`,
            population: this.formatNumber(affectedPopulation),
            economic: `$${this.formatNumber(economicImpact)}`
        };
        
        // Update UI
        if (this.app.components.ui) {
            this.app.components.ui.updateSimulationResults(this.impactResult);
        }
        
        console.log('📊 Impact results:', this.impactResult);
    }

    calculateEnergy() {
        // Kinetic energy = 0.5 * mass * velocity²
        const density = 3000; // kg/m³ (rock)
        const radius = this.parameters.size * 500; // Convert km to meters
        const volume = (4/3) * Math.PI * Math.pow(radius, 3);
        const mass = density * volume;
        const velocity = this.parameters.velocity * 1000; // Convert km/s to m/s
        
        return 0.5 * mass * Math.pow(velocity, 2);
    }

    calculateCraterSize(energy) {
        // Simple crater size estimation
        return Math.pow(energy / 1e15, 0.217) * 10; // km
    }

    estimateAffectedPopulation(craterSize) {
        // Very simplified population estimation
        const populationDensity = 50; // people per km²
        const affectedArea = Math.PI * Math.pow(craterSize * 10, 2); // Larger affected area
        
        return affectedArea * populationDensity;
    }

    estimateEconomicImpact(population, craterSize) {
        // Simplified economic impact
        const infrastructureCost = Math.pow(craterSize, 2) * 1000000000; // $1B per km²
        const populationCost = population * 50000; // $50k per person
        
        return infrastructureCost + populationCost;
    }

    formatEnergy(joules) {
        if (joules >= 1e21) return `${(joules / 1e21).toFixed(1)} ZJ`;
        if (joules >= 1e18) return `${(joules / 1e18).toFixed(1)} EJ`;
        if (joules >= 1e15) return `${(joules / 1e15).toFixed(1)} PJ`;
        return `${(joules / 1e12).toFixed(1)} TJ`;
    }

    formatNumber(num) {
        if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
        if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
        if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
        return num.toFixed(0);
    }

    precalculateImpact(asteroid) {
        // Pre-calculate impact scenarios for selected asteroid
        console.log('Pre-calculating impact scenarios for:', asteroid.name);
        
        // This would involve more complex orbital mechanics and impact physics
        // For now, we'll just store the asteroid data
        this.precalculatedAsteroid = asteroid;
    }

    // Method to get current simulation state
    getState() {
        return {
            isRunning: this.isRunning,
            simulationTime: this.simulationTime,
            impactResult: this.impactResult,
            parameters: this.parameters
        };
    }
}

export { SimulationEngine };