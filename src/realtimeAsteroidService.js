import { supabase, DB_CONFIG } from './supabaseClient.js';

/**
 * Real-time Asteroid Data Service
 * Handles live NASA NEO data from Supabase with ML predictions
 */
class RealtimeAsteroidService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 2 * 60 * 1000; // 2 minutes cache
        this.subscribers = new Set();
        this.isConnected = false;
        
        // Real-time subscription
        this.subscription = null;
        
        console.log('🛰️ RealtimeAsteroidService initialized');
    }

    /**
     * Initialize real-time connection to Supabase
     */
    async initialize() {
        try {
            // Test connection
            await this.testConnection();
            
            // Set up real-time subscription
            this.setupRealtimeSubscription();
            
            this.isConnected = true;
            console.log('✅ Real-time asteroid service connected');
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize real-time service:', error);
            this.isConnected = false;
            return false;
        }
    }

    /**
     * Test database connection
     */
    async testConnection() {
        const { data, error } = await supabase
            .from(DB_CONFIG.tables.nasa_neo_data)
            .select('count')
            .limit(1);
            
        if (error) {
            throw error;
        }
        
        console.log('🔌 Database connection verified');
    }

    /**
     * Set up real-time subscription for live asteroid data
     */
    setupRealtimeSubscription() {
        this.subscription = supabase
            .channel('asteroid-updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: DB_CONFIG.tables.nasa_neo_data
            }, (payload) => {
                console.log('📡 Real-time asteroid update:', payload);
                this.handleRealtimeUpdate(payload);
            })
            .subscribe((status) => {
                console.log('📊 Subscription status:', status);
            });
    }

    /**
     * Handle real-time database updates
     */
    handleRealtimeUpdate(payload) {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        // Clear relevant cache entries
        this.clearCache();
        
        // Notify subscribers
        this.notifySubscribers({
            type: eventType,
            data: newRecord || oldRecord,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get all Near-Earth Objects from database
     */
    async getAllNEOs(options = {}) {
        const cacheKey = `all-neos-${JSON.stringify(options)}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('📦 Returning cached NEO data');
                return cached.data;
            }
        }

        try {
            let query = supabase
                .from(DB_CONFIG.tables.nasa_neo_data)
                .select('*');

            // Apply filters
            if (options.hazardousOnly) {
                query = query.eq('is_hazardous', true);
            }
            
            if (options.sentryOnly) {
                query = query.eq('is_sentry', true);
            }
            
            if (options.approachDateFrom) {
                query = query.gte('approach_date', options.approachDateFrom);
            }
            
            if (options.approachDateTo) {
                query = query.lte('approach_date', options.approachDateTo);
            }
            
            if (options.limit) {
                query = query.limit(options.limit);
            }

            // Order by approach date (closest first)
            query = query.order('approach_date', { ascending: true });

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            // Process data for 3D visualization
            const processedData = this.processNEOData(data);
            
            // Cache the results
            this.cache.set(cacheKey, {
                data: processedData,
                timestamp: Date.now()
            });

            console.log(`🗃️ Retrieved ${processedData.length} NEOs from database`);
            return processedData;

        } catch (error) {
            console.error('❌ Error fetching NEOs:', error);
            return [];
        }
    }

    /**
     * Get high-priority asteroids (hazardous or approaching soon)
     */
    async getHighPriorityAsteroids() {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        const { data, error } = await supabase
            .from(DB_CONFIG.tables.nasa_neo_data)
            .select('*')
            .or(`is_hazardous.eq.true,approach_date.lte.${thirtyDaysFromNow.toISOString().split('T')[0]}`)
            .order('approach_date', { ascending: true })
            .limit(50);

        if (error) {
            console.error('❌ Error fetching high-priority asteroids:', error);
            return [];
        }

        return this.processNEOData(data);
    }

    /**
     * Get NEO by ID
     */
    async getNEOById(neoId) {
        const { data, error } = await supabase
            .from(DB_CONFIG.tables.nasa_neo_data)
            .select('*')
            .eq('neo_id', neoId)
            .single();

        if (error) {
            console.error(`❌ Error fetching NEO ${neoId}:`, error);
            return null;
        }

        return this.processNEOData([data])[0];
    }

    /**
     * Process raw NEO data for 3D visualization
     */
    processNEOData(rawData) {
        return rawData.map(neo => ({
            // Core identification
            id: neo.neo_id,
            referenceId: neo.neo_reference_id,
            name: neo.name,
            jplUrl: neo.nasa_jpl_url,
            
            // Physical properties
            absoluteMagnitude: parseFloat(neo.absolute_magnitude_h) || 20,
            diameter: {
                min: parseFloat(neo.diameter_min_km) || 0.1,
                max: parseFloat(neo.diameter_max_km) || 0.2,
                average: (parseFloat(neo.diameter_min_km) + parseFloat(neo.diameter_max_km)) / 2 || 0.15
            },
            
            // Orbital/approach data
            velocity: parseFloat(neo.velocity_kms) || 15,
            missDistance: parseFloat(neo.miss_distance_km) || 1000000,
            approachDate: neo.approach_date,
            approachDateFull: neo.approach_date_full,
            orbitingBody: neo.orbiting_body,
            
            // Risk assessment
            isHazardous: neo.is_hazardous,
            isSentry: neo.is_sentry,
            riskLevel: this.calculateRiskLevel(neo),
            
            // 3D visualization properties
            composition: this.estimateComposition(neo),
            orbit: this.calculateOrbitParameters(neo),
            
            // Metadata
            createdAt: neo.created_at,
            lastUpdated: new Date().toISOString()
        }));
    }

    /**
     * Calculate risk level based on multiple factors
     */
    calculateRiskLevel(neo) {
        let riskScore = 0;
        
        // Hazardous designation
        if (neo.is_hazardous) riskScore += 40;
        if (neo.is_sentry) riskScore += 30;
        
        // Size factor (larger = more dangerous)
        const avgDiameter = (parseFloat(neo.diameter_min_km) + parseFloat(neo.diameter_max_km)) / 2;
        if (avgDiameter > 1.0) riskScore += 20;
        else if (avgDiameter > 0.5) riskScore += 10;
        
        // Approach distance (closer = more dangerous)
        const missDistance = parseFloat(neo.miss_distance_km);
        if (missDistance < 1000000) riskScore += 20; // < 1M km
        else if (missDistance < 5000000) riskScore += 10; // < 5M km
        
        // Velocity factor
        const velocity = parseFloat(neo.velocity_kms);
        if (velocity > 25) riskScore += 10;
        else if (velocity > 15) riskScore += 5;
        
        // Approach time (sooner = higher risk)
        const approachDate = new Date(neo.approach_date);
        const daysUntilApproach = (approachDate - new Date()) / (1000 * 60 * 60 * 24);
        if (daysUntilApproach < 7) riskScore += 15;
        else if (daysUntilApproach < 30) riskScore += 10;
        else if (daysUntilApproach < 90) riskScore += 5;
        
        // Convert to level
        if (riskScore >= 80) return 'CRITICAL';
        if (riskScore >= 60) return 'HIGH';
        if (riskScore >= 40) return 'MEDIUM';
        if (riskScore >= 20) return 'LOW';
        return 'MINIMAL';
    }

    /**
     * Estimate asteroid composition based on magnitude and size
     */
    estimateComposition(neo) {
        const magnitude = parseFloat(neo.absolute_magnitude_h);
        const avgDiameter = (parseFloat(neo.diameter_min_km) + parseFloat(neo.diameter_max_km)) / 2;
        
        // Rough composition estimation
        if (magnitude < 18 && avgDiameter > 1.0) return 'metal';
        if (magnitude > 22) return 'carbon';
        return 'rock';
    }

    /**
     * Calculate orbital parameters for 3D visualization
     */
    calculateOrbitParameters(neo) {
        const missDistance = parseFloat(neo.miss_distance_km);
        const velocity = parseFloat(neo.velocity_kms);
        
        // Convert to scene units (scaled down)
        const semiMajorAxis = Math.max(8, Math.min(20, missDistance / 5000000)); // 8-20 scene units
        const eccentricity = Math.min(0.5, velocity / 50); // Based on velocity
        
        return {
            semiMajorAxis,
            eccentricity,
            inclination: (Math.random() - 0.5) * 0.3, // Random inclination
            orbitalPeriod: semiMajorAxis * 50, // Rough period calculation
            speed: 0.001 + (velocity / 1000), // Animation speed
        };
    }

    /**
     * Subscribe to real-time updates
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        console.log(`📻 Added subscriber (${this.subscribers.size} total)`);
        
        return () => {
            this.subscribers.delete(callback);
            console.log(`📻 Removed subscriber (${this.subscribers.size} total)`);
        };
    }

    /**
     * Notify all subscribers of updates
     */
    notifySubscribers(update) {
        this.subscribers.forEach(callback => {
            try {
                callback(update);
            } catch (error) {
                console.error('❌ Error notifying subscriber:', error);
            }
        });
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 Cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        this.subscribers.clear();
        this.cache.clear();
        console.log('🧹 RealtimeAsteroidService destroyed');
    }
}

export { RealtimeAsteroidService };