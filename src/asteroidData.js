// Asteroid Data Service
// Handles fetching and processing asteroid data from Supabase

import { supabase, DB_CONFIG } from './supabaseClient.js';

class AsteroidDataService {
    constructor() {
        this.asteroidData = [];
        this.isLoading = false;
        this.lastFetchTime = null;
    }

    /**
     * Fetch asteroid data from Supabase
     * @param {number} limit - Maximum number of asteroids to fetch
     * @returns {Promise<Array>} - Array of asteroid data
     */
    async fetchAsteroidData(limit = 20) {
        this.isLoading = true;
        
        try {
            const { data, error } = await supabase
                .from(DB_CONFIG.tables.nasa_neo_data)
                .select(`
                    ${DB_CONFIG.columns.neo_id},
                    ${DB_CONFIG.columns.name},
                    ${DB_CONFIG.columns.absolute_magnitude_h},
                    ${DB_CONFIG.columns.diameter_min_km},
                    ${DB_CONFIG.columns.diameter_max_km},
                    ${DB_CONFIG.columns.velocity_kms},
                    ${DB_CONFIG.columns.miss_distance_km},
                    ${DB_CONFIG.columns.approach_date},
                    ${DB_CONFIG.columns.is_hazardous},
                    ${DB_CONFIG.columns.orbiting_body}
                `)
                .order(DB_CONFIG.columns.approach_date, { ascending: true })
                .limit(limit);
                
            if (error) {
                console.error('Error fetching asteroid data:', error);
                return [];
            }
            
            this.asteroidData = this.processAsteroidData(data);
            this.lastFetchTime = new Date();
            return this.asteroidData;
            
        } catch (err) {
            console.error('Failed to fetch asteroid data:', err);
            return [];
        } finally {
            this.isLoading = false;
        }
    }
    
    /**
     * Process raw asteroid data into a format suitable for 3D visualization
     * @param {Array} rawData - Raw asteroid data from Supabase
     * @returns {Array} - Processed asteroid data
     */
    processAsteroidData(rawData) {
        return rawData.map(asteroid => {
            // Calculate average diameter
            const avgDiameter = (parseFloat(asteroid[DB_CONFIG.columns.diameter_min_km]) + 
                               parseFloat(asteroid[DB_CONFIG.columns.diameter_max_km])) / 2;
            
            // Calculate scale based on diameter (normalized)
            const scale = Math.max(0.01, Math.min(0.05, avgDiameter * 0.01));
            
            // Generate semi-random orbit parameters based on real data
            const orbitRadius = this.calculateOrbitRadius(asteroid[DB_CONFIG.columns.miss_distance_km]);
            const orbitSpeed = this.calculateOrbitSpeed(asteroid[DB_CONFIG.columns.velocity_kms]);
            const orbitInclination = this.generateOrbitInclination();
            const startAngle = Math.random() * Math.PI * 2;
            
            // Determine asteroid type based on properties
            const type = this.determineAsteroidType(asteroid[DB_CONFIG.columns.is_hazardous]);
            
            return {
                id: asteroid[DB_CONFIG.columns.neo_id],
                name: asteroid[DB_CONFIG.columns.name],
                position: this.calculatePositionFromOrbit(orbitRadius, startAngle, orbitInclination),
                rotation: [0, 0, 0],
                scale: scale,
                velocity: this.calculateVelocityVector(orbitRadius, orbitSpeed, startAngle, orbitInclination),
                type: type,
                orbitData: {
                    radius: orbitRadius,
                    speed: orbitSpeed,
                    inclination: orbitInclination,
                    currentAngle: startAngle
                },
                properties: {
                    magnitude: asteroid[DB_CONFIG.columns.absolute_magnitude_h],
                    diameter: avgDiameter,
                    velocity: asteroid[DB_CONFIG.columns.velocity_kms],
                    missDistance: asteroid[DB_CONFIG.columns.miss_distance_km],
                    approachDate: asteroid[DB_CONFIG.columns.approach_date],
                    isHazardous: asteroid[DB_CONFIG.columns.is_hazardous],
                    orbitingBody: asteroid[DB_CONFIG.columns.orbiting_body]
                }
            };
        });
    }
    
    /**
     * Calculate orbit radius based on miss distance
     * @param {string} missDistance - Miss distance in km
     * @returns {number} - Orbit radius for visualization
     */
    calculateOrbitRadius(missDistance) {
        // Convert miss distance to a reasonable orbit radius for visualization
        // Normalize to a range between 5 and 30 units
        const distance = parseFloat(missDistance);
        return 5 + (Math.min(distance, 5000000) / 5000000) * 25;
    }
    
    /**
     * Calculate orbit speed based on velocity
     * @param {string} velocity - Velocity in km/s
     * @returns {number} - Orbit speed for visualization
     */
    calculateOrbitSpeed(velocity) {
        // Convert velocity to a reasonable orbit speed for visualization
        // Normalize to a range between 0.001 and 0.01
        const speed = parseFloat(velocity);
        return 0.001 + (Math.min(speed, 50) / 50) * 0.009;
    }
    
    /**
     * Generate a semi-random orbit inclination
     * @returns {number} - Orbit inclination in radians
     */
    generateOrbitInclination() {
        // Generate a random inclination between -0.5 and 0.5 radians
        return (Math.random() - 0.5) * 1.0;
    }
    
    /**
     * Calculate position from orbit parameters
     * @param {number} radius - Orbit radius
     * @param {number} angle - Current angle in orbit
     * @param {number} inclination - Orbit inclination
     * @returns {Array} - [x, y, z] position
     */
    calculatePositionFromOrbit(radius, angle, inclination) {
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle) * Math.cos(inclination);
        const z = radius * Math.sin(angle) * Math.sin(inclination);
        return [x, y, z];
    }
    
    /**
     * Calculate velocity vector based on orbit parameters
     * @param {number} radius - Orbit radius
     * @param {number} speed - Orbit speed
     * @param {number} angle - Current angle in orbit
     * @param {number} inclination - Orbit inclination
     * @returns {Array} - [vx, vy, vz] velocity vector
     */
    calculateVelocityVector(radius, speed, angle, inclination) {
        // Tangential velocity vector
        const vx = -speed * Math.sin(angle);
        const vy = speed * Math.cos(angle) * Math.cos(inclination);
        const vz = speed * Math.cos(angle) * Math.sin(inclination);
        return [vx, vy, vz];
    }
    
    /**
     * Determine asteroid type based on properties
     * @param {boolean} isHazardous - Whether the asteroid is hazardous
     * @returns {string} - Asteroid type ('carbon', 'rock', or 'metal')
     */
    determineAsteroidType(isHazardous) {
        if (isHazardous) {
            // Hazardous asteroids are more likely to be metal
            return Math.random() > 0.3 ? 'metal' : 'rock';
        } else {
            // Non-hazardous asteroids are more likely to be carbon or rock
            const rand = Math.random();
            if (rand < 0.4) return 'carbon';
            if (rand < 0.8) return 'rock';
            return 'metal';
        }
    }
    
    /**
     * Update asteroid positions based on their orbit parameters
     * @param {number} deltaTime - Time elapsed since last update
     */
    updateAsteroidPositions(deltaTime = 1) {
        return this.asteroidData.map(asteroid => {
            // Update orbit angle
            asteroid.orbitData.currentAngle += asteroid.orbitData.speed * deltaTime;
            
            // Calculate new position
            asteroid.position = this.calculatePositionFromOrbit(
                asteroid.orbitData.radius,
                asteroid.orbitData.currentAngle,
                asteroid.orbitData.inclination
            );
            
            // Calculate new velocity vector
            asteroid.velocity = this.calculateVelocityVector(
                asteroid.orbitData.radius,
                asteroid.orbitData.speed,
                asteroid.orbitData.currentAngle,
                asteroid.orbitData.inclination
            );
            
            // Update rotation
            asteroid.rotation[0] += 0.01 * deltaTime;
            asteroid.rotation[1] += 0.005 * deltaTime;
            asteroid.rotation[2] += 0.002 * deltaTime;
            
            return asteroid;
        });
    }
}

export const asteroidDataService = new AsteroidDataService();