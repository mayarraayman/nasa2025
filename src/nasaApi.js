class NASAAPI {
    constructor() {
        this.baseURL = 'https://api.nasa.gov/neo/rest/v1';
        this.apiKey = 'af5S51nRvkgYF4SS8poSdRmSsj0KTJfVjpqNq43x'; // NASA API key
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        // Fallback data for when API is unavailable
        this.fallbackAsteroids = this.generateFallbackData();
    }

    async getNearEarthObjects(startDate = null, endDate = null) {
        const cacheKey = `neos-${startDate}-${endDate}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            let url = `${this.baseURL}/feed?api_key=${this.apiKey}`;
            
            if (startDate) {
                url += `&start_date=${startDate}`;
            }
            if (endDate) {
                url += `&end_date=${endDate}`;
            }

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`NASA API error: ${response.status}`);
            }

            const data = await response.json();
            const processedData = this.processNEOData(data);
            
            // Cache the results
            this.cache.set(cacheKey, {
                data: processedData,
                timestamp: Date.now()
            });
            
            return processedData;

        } catch (error) {
            console.warn('NASA API unavailable, using fallback data:', error);
            return this.fallbackAsteroids;
        }
    }

    async getAsteroidDetails(asteroidId) {
        const cacheKey = `asteroid-${asteroidId}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey).data;
        }

        try {
            const response = await fetch(
                `${this.baseURL}/neo/${asteroidId}?api_key=${this.apiKey}`
            );
            
            if (!response.ok) {
                throw new Error(`NASA API error: ${response.status}`);
            }

            const data = await response.json();
            const processedData = this.processAsteroidDetails(data);
            
            this.cache.set(cacheKey, {
                data: processedData,
                timestamp: Date.now()
            });
            
            return processedData;

        } catch (error) {
            console.warn('Failed to fetch asteroid details:', error);
            return this.generateFallbackAsteroid(asteroidId);
        }
    }

    async getAsteroidOrbit(asteroidId) {
        try {
            const response = await fetch(
                `https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=${asteroidId}`
            );
            
            if (!response.ok) {
                throw new Error(`JPL API error: ${response.status}`);
            }

            const data = await response.json();
            return this.processOrbitData(data);

        } catch (error) {
            console.warn('Failed to fetch orbit data:', error);
            return this.generateFallbackOrbit();
        }
    }

    processNEOData(data) {
        const asteroids = [];
        
        if (data.near_earth_objects) {
            Object.values(data.near_earth_objects).forEach(dayAsteroids => {
                dayAsteroids.forEach(neo => {
                    const asteroid = this.processAsteroid(neo);
                    if (asteroid) {
                        asteroids.push(asteroid);
                    }
                });
            });
        }
        
        return asteroids;
    }

    processAsteroid(neo) {
        try {
            const closeApproach = neo.close_approach_data?.[0];
            const estimatedDiameter = neo.estimated_diameter?.kilometers;
            
            return {
                id: neo.id,
                name: neo.name,
                designation: neo.designation,
                diameter: this.calculateAverageDiameter(estimatedDiameter),
                velocity: parseFloat(closeApproach?.relative_velocity?.kilometers_per_second) || 20,
                composition: this.estimateComposition(neo),
                impactProbability: this.calculateImpactProbability(neo),
                magnitude: neo.absolute_magnitude_h,
                hazardous: neo.is_potentially_hazardous_asteroid,
                closeApproach: closeApproach ? {
                    date: closeApproach.close_approach_date,
                    distance: parseFloat(closeApproach.miss_distance?.kilometers),
                    velocity: parseFloat(closeApproach.relative_velocity?.kilometers_per_second)
                } : null,
                orbit: this.extractOrbitData(neo),
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.warn('Error processing asteroid data:', error, neo);
            return null;
        }
    }

    processAsteroidDetails(data) {
        return {
            id: data.id,
            name: data.name,
            designation: data.designation,
            diameter: this.calculateAverageDiameter(data.estimated_diameter?.kilometers),
            mass: data.estimated_mass,
            composition: this.estimateComposition(data),
            rotationalPeriod: data.rotational_period,
            spectralType: data.spectral_type,
            albedo: data.albedo,
            orbitalData: this.extractDetailedOrbit(data.orbital_data),
            discovery: {
                date: data.discovery_date,
                facility: data.discovery_facility,
                observer: data.discoverer
            },
            observations: {
                first: data.observation_date_span?.first,
                last: data.observation_date_span?.last,
                count: data.observation_count
            }
        };
    }

    calculateAverageDiameter(diameterEstimate) {
        if (!diameterEstimate) return 0.5; // Default fallback
        
        const min = diameterEstimate.estimated_diameter_min;
        const max = diameterEstimate.estimated_diameter_max;
        
        return (min + max) / 2;
    }

    estimateComposition(asteroidData) {
        // Simplified composition estimation based on spectral data and albedo
        const albedo = asteroidData.albedo;
        const spectralType = asteroidData.spectral_type;
        
        if (spectralType) {
            if (spectralType.includes('C')) return 'carbonaceous';
            if (spectralType.includes('S')) return 'stony';
            if (spectralType.includes('M')) return 'metal';
        }
        
        if (albedo !== undefined) {
            if (albedo < 0.1) return 'carbonaceous';
            if (albedo > 0.2) return 'metal';
        }
        
        // Default based on statistics (most asteroids are carbonaceous)
        return 'carbonaceous';
    }

    calculateImpactProbability(neo) {
        // Very simplified probability calculation
        // In reality, this would use Sentry and JPL impact risk data
        const isHazardous = neo.is_potentially_hazardous_asteroid;
        const magnitude = neo.absolute_magnitude_h;
        
        if (!isHazardous) return 0.0000001;
        
        // Rough probability based on size and hazard status
        let baseProbability = 0.000001;
        if (magnitude < 20) baseProbability = 0.00001; // Larger objects
        if (magnitude < 18) baseProbability = 0.0001;
        
        return baseProbability;
    }

    extractOrbitData(neo) {
        const orbitalData = neo.orbital_data;
        if (!orbitalData) return null;
        
        return {
            semiMajorAxis: parseFloat(orbitalData.semi_major_axis),
            eccentricity: parseFloat(orbitalData.eccentricity),
            inclination: parseFloat(orbitalData.inclination),
            period: parseFloat(orbitalData.orbital_period),
            perihelion: parseFloat(orbitalData.perihelion_distance),
            aphelion: parseFloat(orbitalData.aphelion_distance)
        };
    }

    extractDetailedOrbit(orbitalData) {
        if (!orbitalData) return null;
        
        return {
            elements: {
                semiMajorAxis: orbitalData.semi_major_axis,
                eccentricity: orbitalData.eccentricity,
                inclination: orbitalData.inclination,
                ascendingNode: orbitalData.ascending_node_longitude,
                argumentOfPeriapsis: orbitalData.argument_of_periapsis,
                meanAnomaly: orbitalData.mean_anomaly
            },
            periods: {
                orbital: orbitalData.orbital_period,
                perihelion: orbitalData.perihelion_distance,
                aphelion: orbitalData.aphelion_distance
            },
            dates: {
                perihelion: orbitalData.perihelion_time,
                aphelion: orbitalData.aphelion_time
            }
        };
    }

    processOrbitData(jplData) {
        if (!jplData || !jplData.orbit) return null;
        
        return {
            elements: jplData.orbit.elements,
            uncertainties: jplData.orbit.uncertainties,
            epoch: jplData.orbit.epoch,
            source: 'JPL Small-Body Database'
        };
    }

    generateFallbackData() {
        // Generate realistic fallback data for demo purposes
        const asteroids = [];
        const names = [
            'Bennu', 'Apophis', 'Ryugu', 'Itokawa', 'Eros', 
            'Golevka', 'Toutatis', 'Geographos', 'Icarus', 'Hathor'
        ];
        
        for (let i = 0; i < 20; i++) {
            asteroids.push(this.generateFallbackAsteroid(`2000-${i}`, names[i % names.length]));
        }
        
        return asteroids;
    }

    generateFallbackAsteroid(id, name = null) {
        const compositions = ['carbonaceous', 'stony', 'metal'];
        const randomComp = compositions[Math.floor(Math.random() * compositions.length)];
        
        return {
            id: id || `fallback-${Date.now()}-${Math.random()}`,
            name: name || `Asteroid ${Math.floor(Math.random() * 10000)}`,
            designation: `2023 ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 100)}`,
            diameter: 0.1 + Math.random() * 2,
            velocity: 5 + Math.random() * 40,
            composition: randomComp,
            impactProbability: Math.random() * 0.0001,
            magnitude: 15 + Math.random() * 10,
            hazardous: Math.random() > 0.7,
            closeApproach: {
                date: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                distance: 1000000 + Math.random() * 50000000,
                velocity: 5 + Math.random() * 40
            },
            orbit: {
                semiMajorAxis: 1 + Math.random() * 3,
                eccentricity: 0.1 + Math.random() * 0.5,
                inclination: Math.random() * 30,
                period: 365 + Math.random() * 2000
            },
            lastUpdated: new Date().toISOString()
        };
    }

    generateFallbackOrbit() {
        return {
            semiMajorAxis: 1.5 + Math.random(),
            eccentricity: 0.1 + Math.random() * 0.3,
            inclination: 5 + Math.random() * 15,
            period: 500 + Math.random() * 1000,
            source: 'Fallback Data'
        };
    }

    // Additional NASA API endpoints
    async getAPOD(date = null) {
        try {
            let url = `https://api.nasa.gov/planetary/apod?api_key=${this.apiKey}`;
            if (date) {
                url += `&date=${date}`;
            }
            
            const response = await fetch(url);
            return response.ok ? await response.json() : null;
        } catch (error) {
            console.warn('APOD API unavailable:', error);
            return null;
        }
    }

    async getDONKIData() {
        try {
            // This would integrate with JPL's DONKI system for space weather
            const response = await fetch(
                `https://api.nasa.gov/DONKI/notifications?api_key=${this.apiKey}`
            );
            return response.ok ? await response.json() : [];
        } catch (error) {
            console.warn('DONKI API unavailable:', error);
            return [];
        }
    }

    // Utility methods
    clearCache() {
        this.cache.clear();
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
        this.clearCache(); // Clear cache when API key changes
    }

    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }

    // Real-time data streaming (WebSocket simulation)
    async subscribeToRealTimeUpdates(callback) {
        // In a real implementation, this would use WebSockets or Server-Sent Events
        // For now, simulate with periodic API calls
        this.updateInterval = setInterval(async () => {
            try {
                const newData = await this.getNearEarthObjects();
                callback(newData);
            } catch (error) {
                console.warn('Real-time update failed:', error);
            }
        }, 30000); // Update every 30 seconds
        
        return () => {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }
        };
    }
}

export { NASAAPI };