import * as THREE from 'three';

/**
 * Orbital Mechanics System
 * Handles proper orbital calculations for celestial bodies around Earth
 */
class OrbitalMechanics {
    constructor() {
        // Earth's properties (as reference center)
        this.earthCenter = new THREE.Vector3(0, 0, 0); // Earth is always at origin
        this.earthRadius = 1.0; // Earth radius in scene units
        this.gravitationalConstant = 1.0; // Scaled for visualization
        
        // Reference to solid Earth core for mass calculations
        this.earthCore = null;
        
        // Orbital bodies registry
        this.orbitalBodies = new Map();
        
        console.log('🌌 Orbital Mechanics System initialized');
        console.log('📍 Earth center set at:', this.earthCenter);
        console.log('🌍 Earth core will provide solid mass for orbital calculations');
    }

    /**
     * Register a celestial body for orbital calculations
     * @param {string} id - Unique identifier for the body
     * @param {THREE.Object3D} object3D - The 3D object to orbit
     * @param {Object} orbitParams - Orbital parameters
     */
    registerOrbitalBody(id, object3D, orbitParams) {
        const defaultParams = {
            semiMajorAxis: 3.0,           // Distance from Earth center
            eccentricity: 0.0,            // Orbital eccentricity (0 = circular)
            inclination: 0.0,             // Orbital inclination in radians
            argumentOfPeriapsis: 0.0,     // Argument of periapsis
            longitudeOfAscendingNode: 0.0, // Longitude of ascending node
            trueAnomaly: 0.0,             // Starting position in orbit
            orbitalPeriod: 100.0,         // Time for complete orbit (arbitrary units)
            clockwise: false              // Orbit direction
        };

        const orbit = { ...defaultParams, ...orbitParams };
        
        // Calculate orbital velocity based on distance
        orbit.angularVelocity = (2 * Math.PI) / orbit.orbitalPeriod;
        if (orbit.clockwise) {
            orbit.angularVelocity *= -1;
        }

        this.orbitalBodies.set(id, {
            object3D: object3D,
            orbit: orbit,
            currentAnomaly: orbit.trueAnomaly,
            lastUpdate: 0
        });

        // Set initial position
        this.updateBodyPosition(id);
        
        console.log(`🛰️ Registered orbital body: ${id}`);
        console.log(`   Semi-major axis: ${orbit.semiMajorAxis} units`);
        console.log(`   Orbital period: ${orbit.orbitalPeriod} time units`);
    }

    /**
     * Update all orbital bodies
     * @param {number} deltaTime - Time elapsed since last update
     */
    update(deltaTime) {
        this.orbitalBodies.forEach((bodyData, id) => {
            this.updateOrbitalBody(id, deltaTime);
        });
    }

    /**
     * Update a specific orbital body's position
     * @param {string} id - Body identifier
     * @param {number} deltaTime - Time elapsed
     */
    updateOrbitalBody(id, deltaTime) {
        const bodyData = this.orbitalBodies.get(id);
        if (!bodyData) return;

        // Update orbital position
        bodyData.currentAnomaly += bodyData.orbit.angularVelocity * deltaTime;
        bodyData.lastUpdate += deltaTime;

        // Keep anomaly in 0-2π range
        while (bodyData.currentAnomaly > 2 * Math.PI) {
            bodyData.currentAnomaly -= 2 * Math.PI;
        }
        while (bodyData.currentAnomaly < 0) {
            bodyData.currentAnomaly += 2 * Math.PI;
        }

        this.updateBodyPosition(id);
    }

    /**
     * Calculate and set the 3D position of an orbital body
     * @param {string} id - Body identifier
     */
    updateBodyPosition(id) {
        const bodyData = this.orbitalBodies.get(id);
        if (!bodyData) return;

        const { object3D, orbit, currentAnomaly } = bodyData;

        // Calculate position in orbital plane using elliptical orbit equations
        const a = orbit.semiMajorAxis;
        const e = orbit.eccentricity;
        
        // Calculate radius for current true anomaly
        const r = a * (1 - e * e) / (1 + e * Math.cos(currentAnomaly));
        
        // Position in orbital plane
        const x = r * Math.cos(currentAnomaly);
        const y = r * Math.sin(currentAnomaly);
        const z = 0;

        // Create position vector
        let position = new THREE.Vector3(x, y, z);

        // Apply orbital rotations
        // 1. Inclination (rotate around X-axis)
        if (orbit.inclination !== 0) {
            position.applyAxisAngle(new THREE.Vector3(1, 0, 0), orbit.inclination);
        }

        // 2. Argument of periapsis (rotate around Z-axis)
        if (orbit.argumentOfPeriapsis !== 0) {
            position.applyAxisAngle(new THREE.Vector3(0, 0, 1), orbit.argumentOfPeriapsis);
        }

        // 3. Longitude of ascending node (rotate around Z-axis)
        if (orbit.longitudeOfAscendingNode !== 0) {
            position.applyAxisAngle(new THREE.Vector3(0, 0, 1), orbit.longitudeOfAscendingNode);
        }

        // Add Earth's center position
        position.add(this.earthCenter);

        // Set the object's position
        object3D.position.copy(position);
    }

    /**
     * Create a visual orbit path for a registered body
     * @param {string} id - Body identifier
     * @param {number} segments - Number of segments in the orbit line
     * @returns {THREE.Line} - The orbit line object
     */
    createOrbitPath(id, segments = 64) {
        const bodyData = this.orbitalBodies.get(id);
        if (!bodyData) return null;

        const { orbit } = bodyData;
        const points = [];

        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * 2 * Math.PI;
            const a = orbit.semiMajorAxis;
            const e = orbit.eccentricity;
            
            const r = a * (1 - e * e) / (1 + e * Math.cos(angle));
            
            let point = new THREE.Vector3(
                r * Math.cos(angle),
                r * Math.sin(angle),
                0
            );

            // Apply the same rotations as position calculation
            if (orbit.inclination !== 0) {
                point.applyAxisAngle(new THREE.Vector3(1, 0, 0), orbit.inclination);
            }
            if (orbit.argumentOfPeriapsis !== 0) {
                point.applyAxisAngle(new THREE.Vector3(0, 0, 1), orbit.argumentOfPeriapsis);
            }
            if (orbit.longitudeOfAscendingNode !== 0) {
                point.applyAxisAngle(new THREE.Vector3(0, 0, 1), orbit.longitudeOfAscendingNode);
            }

            point.add(this.earthCenter);
            points.push(point);
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x4444ff,
            transparent: true,
            opacity: 0.3
        });

        const orbitLine = new THREE.Line(geometry, material);
        orbitLine.userData.bodyId = id;
        
        return orbitLine;
    }

    /**
     * Get Earth's center position (always at origin)
     * @returns {THREE.Vector3} - Earth center position
     */
    getEarthCenter() {
        return this.earthCenter.clone();
    }

    /**
     * Get Earth's radius
     * @returns {number} - Earth radius in scene units
     */
    getEarthRadius() {
        return this.earthRadius;
    }

    /**
     * Calculate orbital velocity at current position
     * @param {string} id - Body identifier
     * @returns {THREE.Vector3} - Velocity vector
     */
    getOrbitalVelocity(id) {
        const bodyData = this.orbitalBodies.get(id);
        if (!bodyData) return new THREE.Vector3();

        const { orbit, currentAnomaly } = bodyData;
        const r = orbit.semiMajorAxis * (1 - orbit.eccentricity * orbit.eccentricity) / 
                  (1 + orbit.eccentricity * Math.cos(currentAnomaly));
        
        // Tangential velocity in orbital plane
        const speed = Math.sqrt(this.gravitationalConstant * (2/r - 1/orbit.semiMajorAxis));
        
        const velocityDirection = new THREE.Vector3(
            -Math.sin(currentAnomaly),
            Math.cos(currentAnomaly),
            0
        ).normalize();

        return velocityDirection.multiplyScalar(speed);
    }

    /**
     * Remove an orbital body from the system
     * @param {string} id - Body identifier
     */
    removeOrbitalBody(id) {
        this.orbitalBodies.delete(id);
        console.log(`🗑️ Removed orbital body: ${id}`);
    }

    /**
     * Get orbital data for a specific body
     * @param {string} id - Body identifier
     * @returns {Object} - Orbital data
     */
    getOrbitalData(id) {
        return this.orbitalBodies.get(id);
    }

    /**
     * Set reference to the solid Earth core mesh
     * @param {THREE.Mesh} earthCore - The invisible solid Earth core mesh
     */
    setEarthCore(earthCore) {
        this.earthCore = earthCore;
        if (earthCore) {
            this.earthCenter.copy(earthCore.position);
            console.log('🌍 Earth core registered - using solid geometry for mass calculations');
            console.log('📍 Earth core position:', earthCore.position);
            console.log('📍 Earth core scale:', earthCore.scale);
        }
    }
    
    /**
     * Update Earth's position (should remain at origin, but allows for flexibility)
     * @param {THREE.Vector3} newPosition - New Earth center position
     */
    setEarthCenter(newPosition) {
        console.warn('⚠️ Earth center should remain at origin for proper orbital mechanics');
        this.earthCenter.copy(newPosition);
        
        // Update Earth core position if it exists
        if (this.earthCore) {
            this.earthCore.position.copy(newPosition);
        }
        
        // Update all orbital body positions
        this.orbitalBodies.forEach((bodyData, id) => {
            this.updateBodyPosition(id);
        });
    }

    /**
     * Get debug information about all orbital bodies
     * @returns {Object} - Debug information
     */
    getDebugInfo() {
        const debug = {
            earthCenter: this.earthCenter,
            earthRadius: this.earthRadius,
            earthCore: this.earthCore ? {
                position: this.earthCore.position.clone(),
                scale: this.earthCore.scale.clone(),
                visible: this.earthCore.visible
            } : null,
            totalBodies: this.orbitalBodies.size,
            bodies: {}
        };

        this.orbitalBodies.forEach((bodyData, id) => {
            debug.bodies[id] = {
                position: bodyData.object3D.position.clone(),
                orbit: { ...bodyData.orbit },
                currentAnomaly: bodyData.currentAnomaly
            };
        });

        return debug;
    }

    /**
     * Clean up the orbital mechanics system
     */
    destroy() {
        this.orbitalBodies.clear();
        console.log('🧹 Orbital Mechanics System destroyed');
    }
}

export { OrbitalMechanics };