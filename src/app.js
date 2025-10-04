import { EarthGlobe } from './earthGlobe.js';
import { AsteroidManager } from './asteroidManager.js';
import { UIManager } from './uiManager.js';
import { SimulationEngine } from './simulationEngine.js';
import { DefenseSystems } from './defenseSystems.js';
import { MultiLanguage } from './multiLanguage.js';
import { NASAAPI } from './nasaApi.js';
import { TabSimulations } from './tabSimulations.js';

class OBLIVARA {
    constructor() {
        this.components = {};
        this.isInitialized = false;
        this.currentAsteroid = null;
        this.simulationRunning = false;
        
        this.init();
    }

    async init() {
        try {
            // Initialize core systems in sequence
            await this.initializeCoreSystems();
            await this.initialize3DEnvironment();
            await this.initializeUI();
            await this.finalizeSetup();
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('❌ OBLIVARA initialization failed:', error);
            this.showError(error);
        }
    }

    async initializeCoreSystems() {
        this.updateLoading('Initializing core systems...', 10);
        
        // Initialize language system first
        this.components.language = new MultiLanguage();
        this.components.language.loadPreference();
        
        // Initialize NASA API
        this.components.nasaAPI = new NASAAPI();
        
        // Initialize physics and defense systems
        this.components.defense = new DefenseSystems();
        
        // Reduced delay for faster loading
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    async initialize3DEnvironment() {
        this.updateLoading('Loading visualization systems...', 30);
        
        // Initialize MapboxGlobe
        if (this.components.ui && this.components.ui.mapboxGlobe) {
            // Initialize tab simulations with the mapbox globe
            this.components.tabSimulations = new TabSimulations(this.components.ui.mapboxGlobe);
            await this.components.tabSimulations.initialize();
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    async initializeUI() {
        this.updateLoading('Setting up user interface...', 60);
        
        this.components.ui = new UIManager(this);
        await this.components.ui.initialize();
        
        // Reduced delay for faster loading
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    async finalizeSetup() {
        this.updateLoading('Finalizing setup...', 90);
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start animation loop
        this.startAnimationLoop();
        
        // Load ONLY real asteroid data from Supabase (no sample data)
        await this.loadOnlyRealAsteroidData();
        
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        this.updateLoading('Ready!', 100);
        this.hideLoadingScreen();
    }

    updateLoading(message, progress) {
        const progressElement = document.getElementById('loadingProgress');
        const statusElement = document.getElementById('loadingStatus');
        
        if (progressElement) {
            progressElement.style.width = `${progress}%`;
        }
        if (statusElement) {
            statusElement.textContent = message;
        }
        
        // Update feature highlights
        this.updateFeatureHighlights(progress);
    }

    updateFeatureHighlights(progress) {
        const features = {
            10: 'earth',
            30: 'asteroids', 
            60: 'defense',
            90: 'simulation'
        };
        
        Object.entries(features).forEach(([threshold, feature]) => {
            const element = document.querySelector(`[data-feature="${feature}"]`);
            if (element && progress >= parseInt(threshold)) {
                element.classList.add('active');
            }
        });
    }

    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            const appContainer = document.getElementById('app');
            
            if (loadingScreen && appContainer) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    appContainer.classList.remove('hidden');
                }, 500);
            }
        }, 1000);
    }

    setupEventListeners() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Fullscreen toggle
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    this.components.ui.switchTab('dashboard');
                    break;
                case '2':
                    e.preventDefault();
                    this.components.ui.switchTab('asteroids');
                    break;
                case '3':
                    e.preventDefault();
                    this.components.ui.switchTab('defense');
                    break;
                case '4':
                    e.preventDefault();
                    this.components.ui.switchTab('simulation');
                    break;
            }
        }

        switch(e.key) {
            case 'Escape':
                this.components.ui.closeAllPanels();
                break;
            case ' ':
                e.preventDefault();
                this.toggleSimulation();
                break;
            case 'r':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.resetView();
                }
                break;
            case 'c':
                // Toggle Earth core visibility for debugging
                if (this.components.earth) {
                    const visible = this.components.earth.toggleEarthCore();
                    console.log(`Earth core ${visible ? 'shown' : 'hidden'} (press 'c' to toggle)`);
                }
                break;
            case 'o':
                // Toggle asteroid orbit paths visibility
                if (this.components.asteroids) {
                    const visible = this.components.asteroids.toggleOrbitPaths();
                    console.log(`Asteroid orbits ${visible ? 'shown' : 'hidden'} (press 'o' to toggle)`);
                }
                break;
            case 'm':
                // Toggle Moon orbit visibility
                if (this.components.earth && this.components.earth.models.moonOrbit) {
                    const moonOrbit = this.components.earth.models.moonOrbit;
                    moonOrbit.visible = !moonOrbit.visible;
                    console.log(`Moon orbit ${moonOrbit.visible ? 'shown' : 'hidden'} (press 'm' to toggle)`);
                }
                break;
        }
    }

    handleResize() {
        if (this.components.earth) {
            this.components.earth.handleResize();
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Fullscreen error:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    async loadOnlyRealAsteroidData() {
        try {
        } catch (error) {
        }
    }

    startAnimationLoop() {
        let lastTime = 0;
        const targetFPS = 30; // Limit to 30 FPS for Windows performance
        const frameInterval = 1000 / targetFPS;
        
        const animate = (currentTime) => {
            requestAnimationFrame(animate);
            
            // Frame rate limiting for Windows
            if (currentTime - lastTime >= frameInterval) {
                // Update and render Earth
                if (this.components.earth) {
                    this.components.earth.update();
                    this.components.earth.render();
                }
                
                // Update asteroids
                if (this.components.asteroids) {
                    this.components.asteroids.update();
                }
                
                // Update simulation if running
                if (this.simulationRunning && this.components.simulation) {
                    this.components.simulation.update();
                }
                
                lastTime = currentTime;
            }
        };
        
        animate(0);
    }

    updatePerformanceStats() {
        // Update FPS counter and other performance metrics
        if (this.components.ui && this.components.earth) {
            const stats = {
                fps: this.components.earth.getFPS(),
                objects: this.components.asteroids ? this.components.asteroids.getAsteroidCount() : 0,
                memory: performance.memory ? (performance.memory.usedJSHeapSize / 1048576).toFixed(1) + ' MB' : 'N/A'
            };
            
            this.components.ui.updatePerformanceStats(stats);
        }
    }

    selectAsteroid(asteroid) {
        this.currentAsteroid = asteroid;
        
        // Update UI
        if (this.components.ui) {
            this.components.ui.showAsteroidDetails(asteroid);
        }
        
        // Highlight asteroid in 3D scene
        if (this.components.asteroids) {
            this.components.asteroids.highlightAsteroid(asteroid.id);
        }
        
        // Pre-calculate impact scenarios
        if (this.components.simulation) {
            this.components.simulation.precalculateImpact(asteroid);
        }
    }

    startSimulation(parameters) {
        this.simulationRunning = true;
        
        if (this.components.simulation) {
            this.components.simulation.start(parameters);
        }
        
        if (this.components.ui) {
            this.components.ui.showSimulationResults();
        }
    }

    stopSimulation() {
        this.simulationRunning = false;
        
        if (this.components.simulation) {
            this.components.simulation.stop();
        }
    }

    toggleSimulation() {
        if (this.simulationRunning) {
            this.stopSimulation();
        } else {
            this.startSimulation();
        }
    }

    resetView() {
        if (this.components.earth) {
            this.components.earth.resetCamera();
        }
    }

    showError(error) {
        console.error('Application error:', error);
        
        // Show error in UI
        if (this.components.ui) {
            this.components.ui.addAlert('critical', 'System Error', error.message);
        }
        
        // Fallback error display
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4757;
            color: white;
            padding: 2rem;
            border-radius: 8px;
            z-index: 10000;
            text-align: center;
            max-width: 400px;
        `;
        errorDiv.innerHTML = `
            <h3>🚨 System Error</h3>
            <p>${error.message}</p>
            <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: white; color: #ff4757; border: none; border-radius: 4px; cursor: pointer;">
                Reload Application
            </button>
        `;
        document.body.appendChild(errorDiv);
    }

    // Debug orbital mechanics system
    debugOrbitalMechanics() {
        if (!this.components.earth || !this.components.earth.getOrbitalMechanics()) {
            console.warn('⚠️ No orbital mechanics system to debug');
            return;
        }
        
        const orbitalMechanics = this.components.earth.getOrbitalMechanics();
        const debugInfo = orbitalMechanics.getDebugInfo();
        
        console.log('🌌 === ORBITAL MECHANICS DEBUG ===');
        console.log('📍 Earth Center:', debugInfo.earthCenter);
        console.log('🌍 Earth Radius:', debugInfo.earthRadius);
        console.log('🛰️ Total Orbital Bodies:', debugInfo.totalBodies);
        
        Object.entries(debugInfo.bodies).forEach(([id, body]) => {
            console.log(`🛰️ ${id}:`);
            console.log(`   Position: (${body.position.x.toFixed(2)}, ${body.position.y.toFixed(2)}, ${body.position.z.toFixed(2)})`);
            console.log(`   Semi-major axis: ${body.orbit.semiMajorAxis}`);
            console.log(`   Orbital period: ${body.orbit.orbitalPeriod}`);
            console.log(`   Current anomaly: ${(body.currentAnomaly * 180 / Math.PI).toFixed(1)}°`);
        });
        console.log('🌌 === END ORBITAL DEBUG ===');
        
        // Set up periodic debug updates
        setInterval(() => {
            this.updateOrbitalDebugOverlay();
        }, 2000);
    }
    
    // Update the debug overlay with current orbital mechanics data
    updateOrbitalDebugOverlay() {
        if (!this.components.earth || !this.components.earth.getOrbitalMechanics()) return;
        
        const orbitalMechanics = this.components.earth.getOrbitalMechanics();
        const debugInfo = orbitalMechanics.getDebugInfo();
        
        // Update the HTML debug overlay if it exists
        const debugEarth = document.getElementById('debug-earth');
        const debugMoon = document.getElementById('debug-moon');
        const debugAsteroids = document.getElementById('debug-asteroids');
        
        if (debugEarth) {
            const coreInfo = debugInfo.earthCore ? 
                `Core: SOLID (${debugInfo.earthCore.position.x.toFixed(1)}, ${debugInfo.earthCore.position.y.toFixed(1)}, ${debugInfo.earthCore.position.z.toFixed(1)})` : 
                'Core: HOLLOW';
            
            debugEarth.innerHTML = `
                <strong>EARTH</strong><br>
                Center: (${debugInfo.earthCenter.x}, ${debugInfo.earthCenter.y}, ${debugInfo.earthCenter.z})<br>
                Radius: ${debugInfo.earthRadius}<br>
                ${coreInfo}<br>
                Orbital Bodies: ${debugInfo.totalBodies}
            `;
        }
        
        if (debugMoon && debugInfo.bodies.moon) {
            const moon = debugInfo.bodies.moon;
            const distanceFromEarth = Math.sqrt(
                moon.position.x * moon.position.x + 
                moon.position.y * moon.position.y + 
                moon.position.z * moon.position.z
            );
            debugMoon.innerHTML = `
                <strong>MOON</strong><br>
                Position: (${moon.position.x.toFixed(2)}, ${moon.position.y.toFixed(2)}, ${moon.position.z.toFixed(2)})<br>
                Distance from Earth: ${distanceFromEarth.toFixed(2)}<br>
                Orbital angle: ${(moon.currentAnomaly * 180 / Math.PI).toFixed(1)}°
            `;
        }
        
        if (debugAsteroids && this.components.asteroids) {
            const stats = this.components.asteroids.getRealTimeStats();
            const asteroidBodies = Object.entries(debugInfo.bodies).filter(([id]) => id.startsWith('orbital_asteroid'));
            
            debugAsteroids.innerHTML = `
                <strong>ASTEROID SYSTEM</strong><br>
                Real asteroids: ${stats.totalReal}<br>
                Orbital asteroids: ${stats.totalOrbital}<br>
                <strong>ML RISK LEVELS:</strong><br>
                🔴 Critical: ${stats.riskDistribution.CRITICAL || 0}<br>
                🟠 High: ${stats.riskDistribution.HIGH || 0}<br>
                🟡 Medium: ${stats.riskDistribution.MEDIUM || 0}<br>
                🟢 Low: ${stats.riskDistribution.LOW || 0}<br>
                ML Model: ${stats.mlModelInfo.status}<br>
                DB: ${stats.connectionStatus ? '🟢 Connected' : '🔴 Offline'}
            `;
        }
    }

    // Public API for other components
    getAsteroidData() {
        return this.components.asteroids ? this.components.asteroids.getAsteroids() : [];
    }

    getEarthGlobe() {
        return this.components.earth;
    }

    getLanguageSystem() {
        return this.components.language;
    }

    getCurrentAsteroid() {
        return this.currentAsteroid;
    }

    isSimulationRunning() {
        return this.simulationRunning;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.oblivara = new OBLIVARA();
});

// Export for testing and debugging
export { OBLIVARA };