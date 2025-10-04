import * as tf from '@tensorflow/tfjs';

/**
 * Asteroid ML Predictor
 * Uses TensorFlow.js for real-time asteroid impact risk prediction
 */
class AsteroidMLPredictor {
    constructor() {
        this.model = null;
        this.isInitialized = false;
        this.featureScalers = null;
        
        // Feature configuration based on NASA NEO data
        this.features = [
            'absolute_magnitude_h',
            'diameter_average',
            'velocity_kms',
            'miss_distance_km',
            'days_until_approach',
            'is_hazardous_numeric',
            'is_sentry_numeric'
        ];
        
        console.log('🧠 AsteroidMLPredictor initialized');
    }

    /**
     * Initialize the ML model
     */
    async initialize() {
        try {
            // Create and train a simple neural network model
            await this.createModel();
            await this.trainModel();
            
            this.isInitialized = true;
            console.log('✅ ML Predictor initialized and trained');
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize ML predictor:', error);
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Create the neural network model
     */
    async createModel() {
        // Create a sequential model for impact risk prediction
        this.model = tf.sequential({
            layers: [
                // Input layer
                tf.layers.dense({
                    inputShape: [this.features.length],
                    units: 32,
                    activation: 'relu',
                    name: 'input_layer'
                }),
                
                // Hidden layers
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({
                    units: 16,
                    activation: 'relu',
                    name: 'hidden1'
                }),
                
                tf.layers.dropout({ rate: 0.1 }),
                tf.layers.dense({
                    units: 8,
                    activation: 'relu',
                    name: 'hidden2'
                }),
                
                // Output layer (risk probability)
                tf.layers.dense({
                    units: 1,
                    activation: 'sigmoid',
                    name: 'output_layer'
                })
            ]
        });

        // Compile the model
        this.model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });

        console.log('🏗️ Neural network model created');
        this.model.summary();
    }

    /**
     * Train the model with synthetic data (in real app, use your CSV data)
     */
    async trainModel() {
        // Generate synthetic training data based on realistic asteroid parameters
        const trainingData = this.generateTrainingData(1000);
        
        const xs = tf.tensor2d(trainingData.features);
        const ys = tf.tensor2d(trainingData.labels, [trainingData.labels.length, 1]);

        // Train the model
        console.log('🎓 Training ML model...');
        
        await this.model.fit(xs, ys, {
            epochs: 50,
            batchSize: 32,
            validationSplit: 0.2,
            verbose: 0,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    if (epoch % 10 === 0) {
                        console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
                    }
                }
            }
        });

        // Calculate feature scalers for normalization
        this.calculateFeatureScalers(trainingData.features);

        // Clean up tensors
        xs.dispose();
        ys.dispose();

        console.log('✅ Model training completed');
    }

    /**
     * Generate synthetic training data
     */
    generateTrainingData(numSamples) {
        const features = [];
        const labels = [];

        for (let i = 0; i < numSamples; i++) {
            // Generate realistic asteroid parameters
            const absoluteMagnitude = 15 + Math.random() * 15; // 15-30
            const diameterAvg = Math.pow(10, (25.0 - absoluteMagnitude) / 5.0) / 1000; // km
            const velocity = 5 + Math.random() * 45; // 5-50 km/s
            const missDistance = Math.random() * 100000000; // 0-100M km
            const daysUntilApproach = Math.random() * 365; // 0-365 days
            const isHazardous = diameterAvg > 0.14 && missDistance < 7500000 ? 1 : 0;
            const isSentry = Math.random() < 0.05 ? 1 : 0; // 5% are sentry objects

            // Calculate risk label based on multiple factors
            let riskScore = 0;
            if (isHazardous) riskScore += 0.4;
            if (isSentry) riskScore += 0.3;
            if (diameterAvg > 1.0) riskScore += 0.2;
            if (missDistance < 1000000) riskScore += 0.3;
            if (velocity > 30) riskScore += 0.1;
            if (daysUntilApproach < 30) riskScore += 0.2;

            const riskLabel = riskScore > 0.5 ? 1 : 0;

            features.push([
                absoluteMagnitude,
                diameterAvg,
                velocity,
                missDistance,
                daysUntilApproach,
                isHazardous,
                isSentry
            ]);
            
            labels.push(riskLabel);
        }

        return { features, labels };
    }

    /**
     * Calculate feature scalers for normalization
     */
    calculateFeatureScalers(features) {
        const numFeatures = features[0].length;
        this.featureScalers = {
            means: new Array(numFeatures).fill(0),
            stds: new Array(numFeatures).fill(1)
        };

        // Calculate means
        for (let i = 0; i < numFeatures; i++) {
            const values = features.map(f => f[i]);
            this.featureScalers.means[i] = values.reduce((a, b) => a + b, 0) / values.length;
        }

        // Calculate standard deviations
        for (let i = 0; i < numFeatures; i++) {
            const values = features.map(f => f[i]);
            const mean = this.featureScalers.means[i];
            const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
            this.featureScalers.stds[i] = Math.sqrt(variance) || 1;
        }

        console.log('📊 Feature scalers calculated:', this.featureScalers);
    }

    /**
     * Predict impact risk for a single asteroid
     */
    async predictImpactRisk(asteroidData) {
        if (!this.isInitialized || !this.model) {
            console.warn('⚠️ ML Predictor not initialized');
            return { risk: 0.1, confidence: 0.0 };
        }

        try {
            // Extract and normalize features
            const features = this.extractFeatures(asteroidData);
            const normalizedFeatures = this.normalizeFeatures(features);

            // Make prediction
            const prediction = tf.tidy(() => {
                const input = tf.tensor2d([normalizedFeatures]);
                const output = this.model.predict(input);
                return output.dataSync()[0];
            });

            // Calculate confidence based on feature quality
            const confidence = this.calculateConfidence(asteroidData);

            return {
                risk: prediction,
                confidence: confidence,
                riskLevel: this.getRiskLevel(prediction),
                factors: this.getSignificantFactors(asteroidData, prediction)
            };

        } catch (error) {
            console.error('❌ Prediction error:', error);
            return { risk: 0.1, confidence: 0.0 };
        }
    }

    /**
     * Predict risks for multiple asteroids
     */
    async predictBatchRisks(asteroidsData) {
        if (!this.isInitialized || !this.model) {
            console.warn('⚠️ ML Predictor not initialized');
            return asteroidsData.map(() => ({ risk: 0.1, confidence: 0.0 }));
        }

        try {
            // Extract features for all asteroids
            const featuresMatrix = asteroidsData.map(asteroid => 
                this.normalizeFeatures(this.extractFeatures(asteroid))
            );

            // Make batch prediction
            const predictions = tf.tidy(() => {
                const inputs = tf.tensor2d(featuresMatrix);
                const outputs = this.model.predict(inputs);
                return outputs.dataSync();
            });

            // Process results
            return asteroidsData.map((asteroid, index) => {
                const risk = predictions[index];
                const confidence = this.calculateConfidence(asteroid);

                return {
                    id: asteroid.id,
                    risk: risk,
                    confidence: confidence,
                    riskLevel: this.getRiskLevel(risk),
                    factors: this.getSignificantFactors(asteroid, risk)
                };
            });

        } catch (error) {
            console.error('❌ Batch prediction error:', error);
            return asteroidsData.map(() => ({ risk: 0.1, confidence: 0.0 }));
        }
    }

    /**
     * Extract features from asteroid data
     */
    extractFeatures(asteroidData) {
        const approachDate = new Date(asteroidData.approachDate);
        const daysUntilApproach = (approachDate - new Date()) / (1000 * 60 * 60 * 24);

        return [
            asteroidData.absoluteMagnitude || 20,
            asteroidData.diameter?.average || 0.15,
            asteroidData.velocity || 15,
            asteroidData.missDistance || 1000000,
            Math.max(0, daysUntilApproach),
            asteroidData.isHazardous ? 1 : 0,
            asteroidData.isSentry ? 1 : 0
        ];
    }

    /**
     * Normalize features using calculated scalers
     */
    normalizeFeatures(features) {
        if (!this.featureScalers) return features;

        return features.map((feature, index) => {
            const mean = this.featureScalers.means[index];
            const std = this.featureScalers.stds[index];
            return (feature - mean) / std;
        });
    }

    /**
     * Calculate prediction confidence based on data quality
     */
    calculateConfidence(asteroidData) {
        let confidence = 1.0;

        // Reduce confidence for missing or uncertain data
        if (!asteroidData.absoluteMagnitude) confidence *= 0.8;
        if (!asteroidData.diameter?.average) confidence *= 0.8;
        if (!asteroidData.velocity) confidence *= 0.9;
        if (!asteroidData.missDistance) confidence *= 0.7;
        if (!asteroidData.approachDate) confidence *= 0.6;

        return Math.max(0.1, confidence);
    }

    /**
     * Convert risk probability to level
     */
    getRiskLevel(riskProbability) {
        if (riskProbability >= 0.8) return 'CRITICAL';
        if (riskProbability >= 0.6) return 'HIGH';
        if (riskProbability >= 0.4) return 'MEDIUM';
        if (riskProbability >= 0.2) return 'LOW';
        return 'MINIMAL';
    }

    /**
     * Identify significant risk factors
     */
    getSignificantFactors(asteroidData, riskProbability) {
        const factors = [];

        if (asteroidData.isHazardous) {
            factors.push({ factor: 'Potentially Hazardous', weight: 0.4 });
        }
        
        if (asteroidData.isSentry) {
            factors.push({ factor: 'Sentry Object', weight: 0.3 });
        }

        if (asteroidData.diameter?.average > 1.0) {
            factors.push({ factor: 'Large Size', weight: 0.2 });
        }

        if (asteroidData.missDistance < 1000000) {
            factors.push({ factor: 'Close Approach', weight: 0.3 });
        }

        if (asteroidData.velocity > 30) {
            factors.push({ factor: 'High Velocity', weight: 0.1 });
        }

        const approachDate = new Date(asteroidData.approachDate);
        const daysUntilApproach = (approachDate - new Date()) / (1000 * 60 * 60 * 24);
        if (daysUntilApproach < 30) {
            factors.push({ factor: 'Imminent Approach', weight: 0.2 });
        }

        return factors.sort((a, b) => b.weight - a.weight);
    }

    /**
     * Get model performance metrics
     */
    getModelInfo() {
        if (!this.isInitialized) {
            return { status: 'Not Initialized' };
        }

        return {
            status: 'Ready',
            features: this.features,
            modelLayers: this.model.layers.length,
            trainableParams: this.model.countParams(),
            initialized: this.isInitialized
        };
    }

    /**
     * Retrain model with new data
     */
    async retrainModel(newTrainingData) {
        console.log('🔄 Retraining model with new data...');
        
        const xs = tf.tensor2d(newTrainingData.features);
        const ys = tf.tensor2d(newTrainingData.labels, [newTrainingData.labels.length, 1]);

        await this.model.fit(xs, ys, {
            epochs: 20,
            batchSize: 16,
            verbose: 0
        });

        xs.dispose();
        ys.dispose();

        console.log('✅ Model retrained successfully');
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.model) {
            this.model.dispose();
        }
        this.isInitialized = false;
        console.log('🧹 ML Predictor destroyed');
    }
}

export { AsteroidMLPredictor };