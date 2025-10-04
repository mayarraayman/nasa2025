class DefenseSystems {
    constructor() {
        this.defenseMethods = {
            KINETIC_IMPACTOR: {
                name: 'Kinetic Impactor',
                description: 'Spacecraft collides with asteroid to change its velocity',
                effectiveness: 0.7,
                cost: 500, // millions USD
                developmentTime: 5, // years
                successRate: 0.85,
                technologyReadiness: 9 // 1-10 scale
            },
            GRAVITY_TRACTOR: {
                name: 'Gravity Tractor',
                description: 'Spacecraft uses gravity to slowly pull asteroid',
                effectiveness: 0.4,
                cost: 800,
                developmentTime: 8,
                successRate: 0.95,
                technologyReadiness: 6
            },
            NUCLEAR_DEVICE: {
                name: 'Nuclear Disruption',
                description: 'Nuclear explosion to fragment or deflect asteroid',
                effectiveness: 0.9,
                cost: 2000,
                developmentTime: 3,
                successRate: 0.75,
                technologyReadiness: 7
            },
            LASER_ABLATION: {
                name: 'Laser Ablation',
                description: 'Lasers vaporize asteroid surface to create thrust',
                effectiveness: 0.6,
                cost: 1200,
                developmentTime: 10,
                successRate: 0.80,
                technologyReadiness: 4
            },
            ION_BEAM: {
                name: 'Ion Beam Shepherd',
                description: 'Ion engines directed at asteroid surface',
                effectiveness: 0.5,
                cost: 1500,
                developmentTime: 12,
                successRate: 0.88,
                technologyReadiness: 3
            }
        };

        this.dartMissionData = this.initializeDARTMission();
    }

    initializeDARTMission() {
        return {
            name: "DART (Double Asteroid Redirection Test)",
            target: "Dimorphos",
            launchDate: "2021-11-24",
            impactDate: "2022-09-26",
            impactSpeed: "6.1 km/s",
            mass: "500 kg",
            cost: "$324 million",
            result: "Orbital period changed by 32 minutes",
            success: true,
            lessons: [
                "Kinetic impact technology is viable for planetary defense",
                "Precise navigation and targeting is achievable",
                "International collaboration enhances mission success",
                "Early detection provides more deflection options"
            ]
        };
    }

    calculateDeflection(asteroidData, defenseMethod, timeToImpact) {
        const method = this.defenseMethods[defenseMethod];
        if (!method) {
            throw new Error(`Unknown defense method: ${defenseMethod}`);
        }

        const asteroidMass = this.calculateAsteroidMass(asteroidData);
        const requiredDeltaV = this.calculateRequiredDeltaV(asteroidData, timeToImpact);
        
        let achievableDeltaV = 0;
        
        switch(defenseMethod) {
            case 'KINETIC_IMPACTOR':
                achievableDeltaV = this.calculateKineticDeflection(asteroidMass, timeToImpact);
                break;
            case 'GRAVITY_TRACTOR':
                achievableDeltaV = this.calculateGravityTractorDeflection(asteroidMass, timeToImpact);
                break;
            case 'NUCLEAR_DEVICE':
                achievableDeltaV = this.calculateNuclearDeflection(asteroidMass, timeToImpact);
                break;
            case 'LASER_ABLATION':
                achievableDeltaV = this.calculateLaserDeflection(asteroidMass, timeToImpact);
                break;
            case 'ION_BEAM':
                achievableDeltaV = this.calculateIonBeamDeflection(asteroidMass, timeToImpact);
                break;
        }

        // Apply method effectiveness and success rate
        achievableDeltaV *= method.effectiveness;
        const successProbability = method.successRate * this.calculateTimeFactor(timeToImpact);

        const missDistance = this.calculateMissDistance(achievableDeltaV, timeToImpact, asteroidData.velocity);
        const willMiss = achievableDeltaV >= requiredDeltaV;

        return {
            method: method.name,
            description: method.description,
            requiredDeltaV: requiredDeltaV.toExponential(2),
            achievableDeltaV: achievableDeltaV.toExponential(2),
            successProbability: (successProbability * 100).toFixed(1) + '%',
            willMiss: willMiss,
            missDistance: this.formatDistance(missDistance),
            timeRequired: method.developmentTime,
            cost: `$${method.cost}M`,
            technologyReadiness: method.technologyReadiness,
            recommendation: this.generateRecommendation(achievableDeltaV, requiredDeltaV, timeToImpact, method),
            riskAssessment: this.assessRisk(asteroidData, willMiss, missDistance)
        };
    }

    calculateAsteroidMass(asteroidData) {
        const density = this.getDensity(asteroidData.composition);
        const radius = asteroidData.diameter * 500; // Convert km to meters
        const volume = (4/3) * Math.PI * Math.pow(radius, 3);
        return density * volume;
    }

    getDensity(composition) {
        const densities = {
            'stony': 3000,
            'iron': 7800,
            'carbonaceous': 2000,
            'metal': 7800,
            'rock': 3000,
            'ice': 1000
        };
        return densities[composition?.toLowerCase()] || 3000;
    }

    calculateRequiredDeltaV(asteroidData, timeToImpact) {
        const earthRadius = 6371000; // meters
        const safetyMargin = 2; // Miss by at least 2 Earth radii
        
        return (earthRadius * safetyMargin) / (timeToImpact * 31536000); // Convert years to seconds
    }

    calculateKineticDeflection(asteroidMass, timeToImpact) {
        const impactorMass = 500; // kg - DART-like mission
        const impactorVelocity = 6000; // m/s
        const momentumTransfer = impactorMass * impactorVelocity * 3.4; // DART momentum enhancement factor
        
        return momentumTransfer / asteroidMass;
    }

    calculateGravityTractorDeflection(asteroidMass, timeToImpact) {
        const spacecraftMass = 20000; // kg
        const standoffDistance = 50; // meters
        const G = 6.67430e-11;
        
        const acceleration = (G * spacecraftMass) / Math.pow(standoffDistance, 2);
        return acceleration * timeToImpact * 31536000; // Convert years to seconds
    }

    calculateNuclearDeflection(asteroidMass, timeToImpact) {
        const energy = 1e15; // Joules - 1 megaton device
        const efficiency = 0.1; // Energy transfer efficiency
        
        const deltaV = Math.sqrt(2 * energy * efficiency / asteroidMass);
        return deltaV;
    }

    calculateLaserDeflection(asteroidMass, timeToImpact) {
        const laserPower = 1e6; // Watts
        const specificImpulse = 1000; // seconds
        const efficiency = 0.01;
        
        const thrust = (2 * laserPower * efficiency) / (specificImpulse * 9.81);
        const acceleration = thrust / asteroidMass;
        
        return acceleration * timeToImpact * 31536000;
    }

    calculateIonBeamDeflection(asteroidMass, timeToImpact) {
        const ionPower = 5e5; // Watts
        const specificImpulse = 3000; // seconds
        const efficiency = 0.007;
        
        const thrust = (2 * ionPower * efficiency) / (specificImpulse * 9.81);
        const acceleration = thrust / asteroidMass;
        
        return acceleration * timeToImpact * 31536000;
    }

    calculateTimeFactor(timeToImpact) {
        // More time = higher success probability
        if (timeToImpact >= 20) return 1.0;
        if (timeToImpact >= 10) return 0.9;
        if (timeToImpact >= 5) return 0.7;
        if (timeToImpact >= 2) return 0.5;
        if (timeToImpact >= 1) return 0.3;
        return 0.1;
    }

    calculateMissDistance(deltaV, timeToImpact, asteroidVelocity) {
        return deltaV * timeToImpact * 31536000; // meters
    }

    formatDistance(meters) {
        if (meters >= 1e9) return `${(meters / 1e9).toFixed(2)} million km`;
        if (meters >= 1e6) return `${(meters / 1e6).toFixed(2)} thousand km`;
        if (meters >= 1e3) return `${(meters / 1e3).toFixed(2)} km`;
        return `${meters.toFixed(0)} m`;
    }

    generateRecommendation(achievableDeltaV, requiredDeltaV, timeToImpact, method) {
        if (achievableDeltaV >= requiredDeltaV) {
            if (timeToImpact > 15) {
                return `Gravity tractor recommended - most reliable for long timeframe (${method.technologyReadiness}/10 readiness)`;
            } else if (timeToImpact > 5) {
                return `Kinetic impactor recommended - proven technology (${method.technologyReadiness}/10 readiness)`;
            } else if (timeToImpact > 2) {
                return `Nuclear disruption necessary - limited time available (${method.technologyReadiness}/10 readiness)`;
            } else {
                return `Emergency measures required - consider evacuation (${method.technologyReadiness}/10 readiness)`;
            }
        } else {
            return `Combined approach required - no single method sufficient. Consider multiple kinetic impactors.`;
        }
    }

    assessRisk(asteroidData, willMiss, missDistance) {
        if (willMiss) {
            if (parseFloat(missDistance) > 1e9) { // More than 1 million km
                return { level: 'LOW', color: '#00b894', message: 'Asteroid will safely miss Earth' };
            } else {
                return { level: 'MEDIUM', color: '#fdcb6e', message: 'Close approach - continue monitoring' };
            }
        } else {
            return { level: 'HIGH', color: '#ff4757', message: 'Impact likely - implement defense immediately' };
        }
    }

    simulateDARTSuccess() {
        return {
            success: true,
            data: this.dartMissionData,
            simulation: {
                beforeImpact: {
                    orbitalPeriod: "11 hours 55 minutes",
                    distanceFromPrimary: "1.18 km"
                },
                afterImpact: {
                    orbitalPeriod: "11 hours 23 minutes",
                    distanceFromPrimary: "1.15 km",
                    change: "32 minutes faster"
                },
                effectiveness: "Exceeded expectations by 25x"
            }
        };
    }

    generateDefensePlan(asteroidThreats, budget, timeHorizon) {
        const prioritizedThreats = this.prioritizeThreats(asteroidThreats);
        const defensePlan = {
            timeline: [],
            resourceAllocation: {},
            successProbability: 0,
            totalCost: 0,
            remainingBudget: budget,
            threatsMitigated: 0
        };

        prioritizedThreats.forEach((threat, index) => {
            const bestMethod = this.selectBestMethod(threat, timeHorizon, defensePlan.remainingBudget);
            
            if (bestMethod && defensePlan.remainingBudget > 0) {
                const deflection = this.calculateDeflection(threat, bestMethod, timeHorizon);
                const cost = this.defenseMethods[bestMethod].cost;
                
                if (cost <= defensePlan.remainingBudget) {
                    defensePlan.timeline.push({
                        year: new Date().getFullYear() + index,
                        asteroid: threat.name,
                        method: bestMethod,
                        cost: cost,
                        successProbability: deflection.successProbability,
                        threatLevel: this.calculateThreatLevel(threat)
                    });

                    defensePlan.totalCost += cost;
                    defensePlan.remainingBudget -= cost;
                    defensePlan.threatsMitigated++;
                }
            }
        });

        defensePlan.successProbability = this.calculateOverallSuccess(defensePlan.timeline);
        defensePlan.resourceAllocation = this.allocateResources(defensePlan.totalCost, budget);
        defensePlan.efficiency = (defensePlan.threatsMitigated / asteroidThreats.length) * 100;

        return defensePlan;
    }

    prioritizeThreats(asteroidThreats) {
        return asteroidThreats.sort((a, b) => {
            const scoreA = this.calculateThreatScore(a);
            const scoreB = this.calculateThreatScore(b);
            return scoreB - scoreA;
        });
    }

    calculateThreatScore(asteroid) {
        const probability = asteroid.impactProbability || 0;
        const diameter = asteroid.diameter || 0.1;
        const velocity = asteroid.velocity || 20;
        
        // Torino Scale-like calculation
        return probability * Math.pow(diameter, 2) * Math.pow(velocity, 2);
    }

    calculateThreatLevel(asteroid) {
        const score = this.calculateThreatScore(asteroid);
        
        if (score > 1000) return 'CATASTROPHIC';
        if (score > 100) return 'SEVERE';
        if (score > 10) return 'HIGH';
        if (score > 1) return 'MEDIUM';
        return 'LOW';
    }

    selectBestMethod(asteroid, timeHorizon, availableBudget) {
        const methods = Object.keys(this.defenseMethods);
        let bestMethod = null;
        let bestScore = -1;

        methods.forEach(method => {
            const methodData = this.defenseMethods[method];
            
            // Check if within budget
            if (methodData.cost > availableBudget) return;
            
            const deflection = this.calculateDeflection(asteroid, method, timeHorizon);
            const score = deflection.successProbability * (deflection.willMiss ? 1 : 0.5) * (methodData.technologyReadiness / 10);
            
            if (score > bestScore) {
                bestScore = score;
                bestMethod = method;
            }
        });

        return bestMethod;
    }

    calculateOverallSuccess(timeline) {
        if (timeline.length === 0) return 0;
        
        const product = timeline.reduce((acc, mission) => {
            const probability = parseFloat(mission.successProbability) / 100;
            return acc * probability;
        }, 1);
        
        return (product * 100).toFixed(1) + '%';
    }

    allocateResources(totalCost, availableBudget) {
        const allocation = {
            research: totalCost * 0.15,
            development: totalCost * 0.25,
            deployment: totalCost * 0.45,
            monitoring: totalCost * 0.10,
            contingency: totalCost * 0.05
        };

        // Adjust if over budget
        if (totalCost > availableBudget) {
            const scale = availableBudget / totalCost;
            Object.keys(allocation).forEach(key => {
                allocation[key] *= scale;
            });
        }

        // Format for display
        Object.keys(allocation).forEach(key => {
            allocation[key] = `$${Math.round(allocation[key])}M`;
        });

        return allocation;
    }

    getDefenseMethodDetails(method) {
        return this.defenseMethods[method] || null;
    }

    getAllDefenseMethods() {
        return Object.entries(this.defenseMethods).map(([key, data]) => ({
            id: key,
            ...data
        }));
    }

    validateAsteroidForDefense(asteroidData) {
        const issues = [];
        
        if (!asteroidData.diameter || asteroidData.diameter <= 0) {
            issues.push('Invalid asteroid diameter');
        }
        
        if (!asteroidData.velocity || asteroidData.velocity <= 0) {
            issues.push('Invalid asteroid velocity');
        }
        
        if (!asteroidData.composition) {
            issues.push('Unknown asteroid composition');
        }
        
        return {
            isValid: issues.length === 0,
            issues: issues
        };
    }
}

export { DefenseSystems };