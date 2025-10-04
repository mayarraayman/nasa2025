class ImpactPhysics {
    constructor() {
        this.constants = {
            G: 6.67430e-11,           // Gravitational constant (m³/kg/s²)
            EARTH_MASS: 5.972e24,     // kg
            EARTH_RADIUS: 6371000,    // meters
            EARTH_CIRCUMFERENCE: 40075000, // meters
            DENSITY_ROCK: 3000,       // kg/m³
            DENSITY_IRON: 7800,       // kg/m³
            DENSITY_CARBON: 2000,     // kg/m³
            DENSITY_ICE: 1000,        // kg/m³
            HIROSHIMA_BOMB: 6.3e13,   // Joules (15 kilotons TNT)
            MEGATON_TNT: 4.184e15,    // Joules
            SEA_DENSITY: 1025,        // kg/m³ (seawater)
            ATMOSPHERE_HEIGHT: 100000 // meters
        };

        this.materialProperties = {
            'rock': {
                density: 3000,
                strength: 1e7,
                porosity: 0.1
            },
            'iron': {
                density: 7800,
                strength: 3e8,
                porosity: 0.02
            },
            'carbonaceous': {
                density: 2000,
                strength: 5e6,
                porosity: 0.2
            },
            'ice': {
                density: 1000,
                strength: 1e6,
                porosity: 0.05
            }
        };
    }

    calculateKineticEnergy(diameter, velocity, composition = 'rock') {
        const density = this.getMaterialProperty(composition, 'density');
        const radius = (diameter * 1000) / 2; // Convert km to meters
        const volume = (4/3) * Math.PI * Math.pow(radius, 3);
        const mass = density * volume;
        const velocityMS = velocity * 1000; // Convert km/s to m/s
        
        return 0.5 * mass * Math.pow(velocityMS, 2);
    }

    calculateImpactEffects(asteroidData, impactLocation, terrainData = {}) {
        const energy = this.calculateKineticEnergy(
            asteroidData.diameter,
            asteroidData.velocity,
            asteroidData.composition
        );

        const impactAngle = asteroidData.impactAngle || 45;
        const terrainType = terrainData.terrainType || 'land';
        const waterDepth = terrainData.waterDepth || 0;

        const crater = this.calculateCraterFormation(energy, impactAngle, terrainType, asteroidData.composition);
        const seismic = this.calculateSeismicEffects(energy, impactLocation);
        const atmospheric = this.calculateAtmosphericEffects(energy, asteroidData.diameter);
        const tsunami = terrainType === 'ocean' ? 
            this.calculateTsunamiEffects(energy, waterDepth, impactLocation) : null;
        
        const climate = this.calculateClimateEffects(energy, crater.ejectaMass);
        const economic = this.calculateEconomicImpact(crater.diameter, impactLocation, climate.globalEffects);
        const casualties = this.calculateCasualties(crater.diameter, impactLocation, terrainType);

        return {
            energy: {
                joules: energy,
                hiroshimaUnits: energy / this.constants.HIROSHIMA_BOMB,
                megatons: energy / this.constants.MEGATON_TNT,
                equivalent: this.getEnergyEquivalent(energy)
            },
            crater: crater,
            seismic: seismic,
            atmospheric: atmospheric,
            tsunami: tsunami,
            climate: climate,
            economic: economic,
            casualties: casualties,
            severity: this.assessSeverity(energy, casualties.total, economic.total),
            torinoScale: this.calculateTorinoScale(asteroidData.diameter, asteroidData.impactProbability, energy)
        };
    }

    calculateCraterFormation(energy, impactAngle, terrainType, composition) {
        // Using Gault's equation and modern crater scaling laws
        const angleFactor = Math.pow(Math.sin(impactAngle * Math.PI / 180), 0.5);
        const energyTJ = energy / 1e12; // Convert to terajoules
        
        // Simple to complex crater transition around 4km diameter
        let transientDiameter = 1.16 * Math.pow(energyTJ, 0.217) * angleFactor;
        
        // Final crater diameter (accounting for collapse)
        let finalDiameter = transientDiameter;
        if (transientDiameter > 4) {
            finalDiameter = 1.2 * Math.pow(transientDiameter, 1.13);
        }
        
        // Adjust for terrain and composition
        if (terrainType === 'ocean') {
            finalDiameter *= 0.3; // Reduced cratering in water
        } else if (terrainType === 'sedimentary') {
            finalDiameter *= 1.2; // Enhanced cratering in soft rock
        } else if (terrainType === 'crystalline') {
            finalDiameter *= 0.8; // Reduced cratering in hard rock
        }
        
        const depth = finalDiameter * 0.2; // Depth-to-diameter ratio
        const volume = (Math.PI / 6) * Math.pow(finalDiameter, 3) * 0.1; // Simplified volume
        const ejectaMass = volume * 2700; // Average crust density kg/m³
        
        return {
            transientDiameter: transientDiameter.toFixed(1),
            finalDiameter: finalDiameter.toFixed(1),
            depth: depth.toFixed(1),
            volume: this.formatScientific(volume),
            ejectaMass: this.formatScientific(ejectaMass),
            type: finalDiameter > 4 ? 'Complex Crater' : 'Simple Crater'
        };
    }

    calculateSeismicEffects(energy, impactLocation) {
        // Convert impact energy to seismic moment
        const seismicEfficiency = 1e-5; // Fraction of impact energy converted to seismic waves
        const seismicMoment = energy * seismicEfficiency;
        
        // Moment magnitude scale
        const magnitude = (2/3) * Math.log10(seismicMoment) - 6.07;
        
        // Calculate intensity at various distances
        const intensityAtEpicenter = this.calculateIntensity(magnitude, 0);
        const intensityAt100km = this.calculateIntensity(magnitude, 100);
        const intensityAt1000km = this.calculateIntensity(magnitude, 1000);
        
        return {
            magnitude: magnitude.toFixed(1),
            intensity: {
                epicenter: this.getIntensityDescription(intensityAtEpicenter),
                at100km: this.getIntensityDescription(intensityAt100km),
                at1000km: this.getIntensityDescription(intensityAt1000km)
            },
            feltRadius: this.calculateFeltRadius(magnitude),
            damageRadius: this.calculateDamageRadius(magnitude)
        };
    }

    calculateIntensity(magnitude, distanceKm) {
        // Simplified intensity calculation
        const baseIntensity = magnitude * 2 - 4;
        const distanceAttenuation = Math.log10(distanceKm + 1) * 2;
        return Math.max(1, baseIntensity - distanceAttenuation);
    }

    getIntensityDescription(intensity) {
        const scale = {
            1: 'Not felt',
            2: 'Weak',
            3: 'Slight',
            4: 'Moderate',
            5: 'Strong',
            6: 'Very strong',
            7: 'Severe',
            8: 'Violent',
            9: 'Extreme',
            10: 'Catastrophic'
        };
        return scale[Math.floor(intensity)] || 'Unknown';
    }

    calculateAtmosphericEffects(energy, diameter) {
        const energyMT = energy / this.constants.MEGATON_TNT;
        const fireballRadius = 1.5 * Math.pow(energyMT, 0.4); // km
        
        // Airburst height calculation (if applicable)
        const strength = this.getMaterialProperty('rock', 'strength');
        const airburstHeight = diameter > 0.1 ? 
            this.calculateAirburstHeight(diameter, strength) : null;
        
        // Shock wave effects
        const overpressureRadius = this.calculateOverpressureRadius(energy);
        
        return {
            fireball: {
                radius: fireballRadius.toFixed(1),
                duration: (0.1 * Math.pow(energyMT, 0.4)).toFixed(2) // seconds
            },
            airburst: airburstHeight ? {
                height: airburstHeight.toFixed(1),
                airburst: true
            } : {
                height: 'Surface impact',
                airburst: false
            },
            shockwave: {
                overpressure5psi: overpressureRadius.psi5.toFixed(1), // Window breakage
                overpressure20psi: overpressureRadius.psi20.toFixed(1) // Building damage
            }
        };
    }

    calculateAirburstHeight(diameter, strength) {
        // Simplified airburst height calculation
        return 8.5 * Math.pow(diameter, 0.45); // km
    }

    calculateOverpressureRadius(energy) {
        const energyKT = energy / (4.184e12); // Convert to kilotons
        return {
            psi5: 2.5 * Math.pow(energyKT, 1/3), // 5 psi radius (km)
            psi20: 1.0 * Math.pow(energyKT, 1/3)  // 20 psi radius (km)
        };
    }

    calculateTsunamiEffects(energy, waterDepth, impactLocation) {
        if (waterDepth < 100) return null; // No significant tsunami in shallow water
        
        const energyFraction = 0.1; // Fraction of energy transferred to water
        const waveEnergy = energy * energyFraction;
        
        // Initial wave height (meters)
        const initialHeight = 0.5 * Math.pow(waveEnergy / 1e15, 0.25);
        
        // Wave propagation
        const coastalHeight = this.calculateCoastalHeight(initialHeight, impactLocation);
        const inundationDistance = this.calculateInundationDistance(coastalHeight, impactLocation.terrain);
        
        return {
            initialHeight: initialHeight.toFixed(1),
            coastalHeight: coastalHeight.toFixed(1),
            inundationDistance: inundationDistance.toFixed(1),
            warningTime: this.calculateTsunamiWarningTime(impactLocation),
            affectedCoastline: this.estimateAffectedCoastline(impactLocation)
        };
    }

    calculateCoastalHeight(initialHeight, impactLocation) {
        // Simplified wave height attenuation
        const distanceToShore = impactLocation.distanceToShore || 100; // km
        const attenuation = Math.exp(-distanceToShore / 1000);
        return initialHeight * attenuation;
    }

    calculateClimateEffects(energy, ejectaMass) {
        const dustMass = ejectaMass * 0.1; // Fraction that becomes atmospheric dust
        const sootMass = energy > 1e18 ? dustMass * 0.01 : 0; // Fire-generated soot
        
        // Temperature change (simplified climate model)
        const dustOpacity = dustMass / 1e12; // Normalized
        const sootOpacity = sootMass / 1e11;
        
        const maxCooling = -5 * (dustOpacity + sootOpacity); // Degrees Celsius
        const duration = Math.min(10, 2 * (dustOpacity + sootOpacity)); // Years
        
        return {
            globalEffects: maxCooling < -1,
            temperatureChange: maxCooling.toFixed(1),
            duration: duration.toFixed(1),
            mechanisms: [
                'Dust and aerosol injection',
                'Reduced solar radiation',
                'Potential ozone layer damage'
            ],
            agriculturalImpact: this.assessAgriculturalImpact(maxCooling, duration)
        };
    }

    calculateEconomicImpact(craterDiameter, impactLocation, globalEffects) {
        const diameter = parseFloat(craterDiameter);
        const area = Math.PI * Math.pow(diameter / 2, 2); // km²
        
        // Infrastructure damage
        const infrastructureDensity = this.getInfrastructureDensity(impactLocation);
        const infrastructureCost = area * infrastructureDensity * 1e6; // $/km²
        
        // Casualty costs (simplified)
        const casualtyCost = this.calculateCasualtyCosts(impactLocation.population);
        
        // Agricultural losses
        const agriculturalLoss = globalEffects ? area * 5e5 : area * 1e5;
        
        // Global economic impact (if global effects)
        const globalImpact = globalEffects ? 1e12 : 0;
        
        const total = infrastructureCost + casualtyCost + agriculturalLoss + globalImpact;
        
        return {
            infrastructure: this.formatCurrency(infrastructureCost),
            casualties: this.formatCurrency(casualtyCost),
            agriculture: this.formatCurrency(agriculturalLoss),
            global: this.formatCurrency(globalImpact),
            total: this.formatCurrency(total),
            gdpImpact: ((total / 80e12) * 100).toFixed(2) + '%' // % of global GDP
        };
    }

    calculateCasualties(craterDiameter, impactLocation, terrainType) {
        const diameter = parseFloat(craterDiameter);
        
        // Immediate effects zone (lethal)
        const immediateRadius = diameter * 3;
        const immediatePopulation = this.getPopulationInRadius(impactLocation, immediateRadius);
        
        // Severe effects zone (injuries, destruction)
        const severeRadius = diameter * 10;
        const severePopulation = this.getPopulationInRadius(impactLocation, severeRadius) - immediatePopulation;
        
        // Moderate effects zone (damage)
        const moderateRadius = diameter * 50;
        const moderatePopulation = this.getPopulationInRadius(impactLocation, moderateRadius) - severePopulation - immediatePopulation;
        
        // Long-term effects (climate, agriculture)
        const longTermPopulation = this.estimateLongTermCasualties(immediatePopulation + severePopulation);
        
        return {
            immediate: Math.round(immediatePopulation),
            severeInjuries: Math.round(severePopulation * 0.5),
            moderateInjuries: Math.round(moderatePopulation * 0.2),
            longTerm: Math.round(longTermPopulation),
            total: Math.round(immediatePopulation + severePopulation * 0.5 + longTermPopulation)
        };
    }

    getPopulationInRadius(location, radiusKm) {
        // Simplified population estimation
        // In production, use detailed population density data
        const baseDensity = location.populationDensity || 50; // people/km²
        const area = Math.PI * Math.pow(radiusKm, 2);
        return area * baseDensity;
    }

    calculateCasualtyCosts(population) {
        // Statistical value of life and injury costs
        const valueOfLife = 1e6; // USD per life
        const injuryCost = 2e5; // USD per severe injury
        return population * (valueOfLife * 0.1 + injuryCost * 0.3); // Simplified
    }

    assessSeverity(energy, casualties, economicImpact) {
        const energyMT = energy / this.constants.MEGATON_TNT;
        
        if (energyMT > 1000000 || casualties > 1e9) return 'EXTINCTION LEVEL';
        if (energyMT > 100000 || casualties > 1e8) return 'GLOBAL CATASTROPHE';
        if (energyMT > 10000 || casualties > 1e7) return 'CIVILIZATION THREAT';
        if (energyMT > 1000 || casualties > 1e6) return 'REGIONAL CATASTROPHE';
        if (energyMT > 100 || casualties > 1e5) return 'MAJOR DISASTER';
        if (energyMT > 10 || casualties > 1e4) return 'DISASTER';
        if (energyMT > 1 || casualties > 1e3) return 'SIGNIFICANT';
        return 'LOCALIZED';
    }

    calculateTorinoScale(diameter, probability, energy) {
        const energyMT = energy / this.constants.MEGATON_TNT;
        
        // Simplified Torino Scale calculation
        if (probability < 0.0001) return 0; // No hazard
        if (energyMT < 0.1) return 1; // Normal
        if (energyMT < 10) return probability > 0.01 ? 3 : 2; // Meriting attention
        if (energyMT < 100) return probability > 0.01 ? 5 : 4; // Threatening
        if (energyMT < 1000) return probability > 0.01 ? 7 : 6; // Certain collisions
        return probability > 0.01 ? 9 : 8; // Certain great collisions
    }

    // Utility methods
    getMaterialProperty(composition, property) {
        const material = this.materialProperties[composition] || this.materialProperties.rock;
        return material[property];
    }

    getEnergyEquivalent(energy) {
        const hiroshima = energy / this.constants.HIROSHIMA_BOMB;
        const tsarBomba = energy / (50 * this.constants.MEGATON_TNT); // Largest nuclear test
        
        if (hiroshima < 1) return `${hiroshima.toFixed(2)} Hiroshima bombs`;
        if (tsarBomba < 1) return `${hiroshima.toFixed(0)} Hiroshima bombs`;
        return `${tsarBomba.toFixed(1)} Tsar Bomba equivalents`;
    }

    formatScientific(value) {
        if (value >= 1e18) return `${(value / 1e18).toFixed(2)}e+18`;
        if (value >= 1e15) return `${(value / 1e15).toFixed(2)}e+15`;
        if (value >= 1e12) return `${(value / 1e12).toFixed(2)}e+12`;
        if (value >= 1e9) return `${(value / 1e9).toFixed(2)}e+9`;
        return value.toExponential(2);
    }

    formatCurrency(value) {
        if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
        if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
        if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
        return `$${Math.round(value)}`;
    }

    getInfrastructureDensity(location) {
        const densities = {
            'urban': 1000,    // $M/km²
            'suburban': 200,
            'rural': 50,
            'wilderness': 5,
            'ocean': 1
        };
        return densities[location.type] || 50;
    }

    estimateLongTermCasualties(immediateCasualties) {
        // Simplified estimation of long-term effects
        return immediateCasualties * 0.1; // 10% additional long-term casualties
    }

    assessAgriculturalImpact(temperatureChange, duration) {
        const severity = Math.abs(temperatureChange) * duration;
        
        if (severity > 10) return 'GLOBAL FAMINE RISK';
        if (severity > 5) return 'MAJOR CROP FAILURES';
        if (severity > 2) return 'REGIONAL FOOD SHORTAGES';
        if (severity > 1) return 'LOCALIZED CROP DAMAGE';
        return 'MINOR IMPACT';
    }

    // Advanced calculations for specific scenarios
    calculateDeflectionRequirements(asteroidData, missDistance) {
        const timeToImpact = asteroidData.timeToImpact || 10; // years
        const requiredAngle = Math.atan(missDistance / (asteroidData.velocity * timeToImpact * 31536000));
        return {
            angle: requiredAngle * (180 / Math.PI),
            deltaV: asteroidData.velocity * Math.tan(requiredAngle),
            timeToImpact: timeToImpact
        };
    }

    simulateFragmentation(asteroidData, defenseEnergy) {
        const strength = this.getMaterialProperty(asteroidData.composition, 'strength');
        const criticalEnergy = strength * Math.PI * Math.pow(asteroidData.diameter * 500, 2);
        
        if (defenseEnergy > criticalEnergy) {
            return {
                fragmented: true,
                fragmentCount: Math.floor(defenseEnergy / criticalEnergy),
                averageFragmentSize: asteroidData.diameter / Math.sqrt(defenseEnergy / criticalEnergy)
            };
        } else {
            return {
                fragmented: false,
                damage: (defenseEnergy / criticalEnergy) * 100
            };
        }
    }
}

export { ImpactPhysics };