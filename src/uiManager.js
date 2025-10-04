import { MultiLanguage } from './multiLanguage.js';

class UIManager {
    constructor(app) {
        this.app = app;
        this.currentTab = 'impact-analysis';
        this.mapboxGlobe = null;
        
        this.initialize = this.initialize.bind(this);
    }

    async initialize() {
        await this.setupEventListeners();
        await this.initializeMapbox();
        
        return true;
    }

    async setupEventListeners() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        document.querySelectorAll('.close-overlay').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeOverlay();
            });
        });

        document.getElementById('minimize-layers')?.addEventListener('click', () => {
            this.togglePanel('layers-panel');
        });
        
        document.getElementById('minimize-data')?.addEventListener('click', () => {
            this.togglePanel('data-panel');
        });

        this.setupMapboxControls();
    }

    async setupTabSystem() {
        // Initialize with dashboard tab active
        this.switchTab('dashboard');
    }

    async initializePanels() {
        // Ensure default panels are open
        this.openPanels.forEach(panel => {
            this.showPanel(panel);
        });
    }

    async setupSimulationControls() {
        // Setup sliders
        this.setupSlider('sizeSlider', 'sizeValue', 'km');
        this.setupSlider('velocitySlider', 'velocityValue', 'km/s');
        this.setupSlider('angleSlider', 'angleValue', '°');
    }

    setupSlider(sliderId, valueId, unit) {
        const slider = document.getElementById(sliderId);
        const value = document.getElementById(valueId);
        
        if (slider && value) {
            const updateValue = () => {
                value.textContent = `${slider.value} ${unit}`;
            };
            
            slider.addEventListener('input', updateValue);
            updateValue(); // Initial update
        }
    }

    switchTab(tabName) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        this.currentTab = tabName;
        
        // Switch to the corresponding 3D simulation
        if (this.app.components.tabSimulations) {
            this.app.components.tabSimulations.switchToSimulation(tabName);
        }
        
        if (tabName === 'impact-analysis') {
            this.closeOverlay();
        } else {
            this.showOverlay(tabName);
        }
    }

    showOverlay(tabName) {
        document.querySelectorAll('.tab-overlay').forEach(overlay => {
            overlay.classList.add('hidden');
        });
        
        const overlay = document.getElementById(`${tabName}-tab`);
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    }
    
    closeOverlay() {
        document.querySelectorAll('.tab-overlay').forEach(overlay => {
            overlay.classList.add('hidden');
        });
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === 'impact-analysis');
        });
        
        this.currentTab = 'impact-analysis';
    }
    
    togglePanel(panelClass) {
        const panel = document.querySelector(`.${panelClass}`);
        if (panel) {
            panel.classList.toggle('collapsed');
            const minimizeBtn = panel.querySelector('.panel-minimize');
            if (minimizeBtn) {
                minimizeBtn.textContent = panel.classList.contains('collapsed') ? '+' : '−';
            }
        }
    }

    
    async initializeMapbox() {
        try {
            const { MapboxGlobe } = await import('./mapboxGlobe.js');
            
            this.mapboxGlobe = new MapboxGlobe('mapbox-globe');
            await this.mapboxGlobe.initialize();
            
        } catch (error) {
        }
    }
    
    setupMapboxControls() {
        document.querySelectorAll('.layer-control').forEach(control => {
            control.addEventListener('click', (e) => {
                const layer = e.currentTarget.dataset.layer;
                this.toggleMapboxLayer(layer);
            });
        });
        
        this.setupMapboxSlider('building-height', (value) => {
            if (this.mapboxGlobe) {
                this.mapboxGlobe.updatePolygonHeight(value);
            }
        });
        
        this.setupMapboxSlider('impact-intensity', (value) => {
            if (this.mapboxGlobe) {
                this.mapboxGlobe.updateImpactIntensity(value);
            }
        });
        
        document.getElementById('simulate-impact')?.addEventListener('click', () => {
            if (this.mapboxGlobe) {
                this.mapboxGlobe.simulateImpact();
            }
        });
        
        document.getElementById('add-asteroid')?.addEventListener('click', () => {
            if (this.mapboxGlobe) {
                this.mapboxGlobe.addRandomAsteroid();
            }
        });
        
        document.getElementById('reset-view')?.addEventListener('click', () => {
            if (this.mapboxGlobe) {
                this.mapboxGlobe.resetView();
            }
        });
    }
    
    setupMapboxSlider(sliderId, callback) {
        const slider = document.getElementById(sliderId);
        const valueDisplay = slider?.parentElement.querySelector('.range-value');
        
        if (slider && valueDisplay) {
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                valueDisplay.textContent = value.toString();
                callback(value);
            });
        }
    }
    
    toggleMapboxLayer(layer) {
        const control = document.querySelector(`[data-layer="${layer}"]`);
        const toggle = control?.querySelector('.toggle-switch');
        
        if (control && toggle) {
            const isActive = toggle.classList.contains('active');
            toggle.classList.toggle('active', !isActive);
            control.classList.toggle('active', !isActive);
            
            if (this.mapboxGlobe) {
                this.mapboxGlobe.toggleMapLayer(layer, !isActive);
            }
        }
    }

    togglePanel(panelName) {
        if (this.openPanels.has(panelName)) {
            this.hidePanel(panelName);
        } else {
            this.showPanel(panelName);
        }
    }

    showPanel(panelName) {
        const panel = document.querySelector(`.${panelName}-panel`);
        if (panel) {
            panel.style.display = 'block';
            this.openPanels.add(panelName);
        }
    }

    hidePanel(panelName) {
        const panel = document.querySelector(`.${panelName}-panel`);
        if (panel) {
            panel.style.display = 'none';
            this.openPanels.delete(panelName);
        }
    }

    closeAllPanels() {
        this.openPanels.forEach(panel => {
            this.hidePanel(panel);
        });
    }

    showAsteroidDetails(asteroid) {
        const detailsDiv = document.getElementById('asteroidDetails');
        const noSelectionDiv = document.getElementById('noSelection');
        
        if (detailsDiv && noSelectionDiv) {
            noSelectionDiv.classList.add('hidden');
            detailsDiv.classList.remove('hidden');
            
            // Update details
            document.getElementById('asteroidName').textContent = asteroid.name;
            document.getElementById('detailDiameter').textContent = `${asteroid.diameter} km`;
            document.getElementById('detailVelocity').textContent = `${asteroid.velocity} km/s`;
            document.getElementById('detailComposition').textContent = asteroid.composition;
            document.getElementById('detailProbability').textContent = `${(asteroid.impactProbability * 100).toFixed(6)}%`;
            
            // Update threat level
            this.updateThreatLevel(asteroid);
        }
    }

    updateThreatLevel(asteroid) {
        const threatLevel = this.calculateThreatLevel(asteroid);
        const threatElement = document.getElementById('threatLevel');
        
        if (threatElement) {
            threatElement.innerHTML = `
                <span class="threat-indicator ${threatLevel.class}"></span>
                <span class="threat-text">${threatLevel.text}</span>
            `;
        }
    }

    calculateThreatLevel(asteroid) {
        const probability = asteroid.impactProbability;
        const diameter = asteroid.diameter;
        const velocity = asteroid.velocity;
        
        // Simple threat calculation (in real app, use more complex formula)
        const threatScore = probability * diameter * velocity;
        
        if (threatScore > 1) return { class: 'high', text: 'HIGH THREAT' };
        if (threatScore > 0.1) return { class: 'medium', text: 'MEDIUM THREAT' };
        return { class: 'low', text: 'LOW THREAT' };
    }

    addAlert(type, title, message) {
        const alertsList = document.getElementById('alertsList');
        if (!alertsList) return;
        
        const alertItem = document.createElement('div');
        alertItem.className = `alert-item ${type}`;
        alertItem.innerHTML = `
            <div class="alert-header">
                <span class="alert-title">${title}</span>
                <span class="alert-time">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="alert-message">${message}</div>
        `;
        
        alertsList.appendChild(alertItem);
        
        // Auto-remove after 10 seconds for non-critical alerts
        if (type !== 'critical') {
            setTimeout(() => {
                if (alertItem.parentNode) {
                    alertItem.remove();
                }
            }, 10000);
        }
        
        // Scroll to bottom
        alertsList.scrollTop = alertsList.scrollHeight;
    }

    showDefensePanel() {
        const defensePanel = document.getElementById('defensePanel');
        if (defensePanel) {
            defensePanel.classList.remove('hidden');
        }
    }

    hideDefensePanel() {
        const defensePanel = document.getElementById('defensePanel');
        if (defensePanel) {
            defensePanel.classList.add('hidden');
        }
    }

    selectDefenseMethod(method) {
        // Update UI
        document.querySelectorAll('.defense-option').forEach(option => {
            option.classList.remove('active');
        });
        
        document.querySelector(`[data-method="${method}"]`)?.classList.add('active');
        
        // Calculate defense scenario
        const asteroid = this.app.getCurrentAsteroid();
        if (asteroid && this.app.components.defense) {
            const defenseResult = this.app.components.defense.calculateDeflection(
                asteroid, 
                method, 
                10 // years to impact
            );
            
            this.showDefenseResults(defenseResult);
        }
    }

    showDefenseResults(results) {
        this.addAlert('info', 'Defense Analysis', 
            `${results.method}: ${results.willMiss ? 'SUCCESS' : 'PARTIAL'} - ${results.recommendation}`
        );
    }

    startSimulation() {
        const parameters = this.getSimulationParameters();
        this.app.startSimulation(parameters);
        
        // Update UI
        document.getElementById('startSimulation').textContent = 'Stop Simulation';
        document.getElementById('simulationResults')?.classList.remove('hidden');
    }

    stopSimulation() {
        this.app.stopSimulation();
        
        // Update UI
        document.getElementById('startSimulation').textContent = 'Start Simulation';
    }

    getSimulationParameters() {
        return {
            size: parseFloat(document.getElementById('sizeSlider').value),
            velocity: parseFloat(document.getElementById('velocitySlider').value),
            angle: parseFloat(document.getElementById('angleSlider').value),
            composition: 'rock', // Default
            impactLocation: this.getRandomImpactLocation()
        };
    }

    getRandomImpactLocation() {
        const locations = [
            { lat: 40.7128, lon: -74.0060, name: 'New York' },
            { lat: 51.5074, lon: -0.1278, name: 'London' },
            { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },
            { lat: -33.8688, lon: 151.2093, name: 'Sydney' }
        ];
        
        return locations[Math.floor(Math.random() * locations.length)];
    }

    showSimulationResults() {
        const resultsDiv = document.getElementById('simulationResults');
        if (resultsDiv) {
            resultsDiv.classList.remove('hidden');
        }
    }

    updateSimulationResults(results) {
        if (results) {
            document.getElementById('resultEnergy').textContent = results.energy;
            document.getElementById('resultCrater').textContent = results.crater;
            document.getElementById('resultPopulation').textContent = results.population;
            document.getElementById('resultEconomic').textContent = results.economic;
        }
    }

    startDARTSimulation() {
        this.addAlert('info', 'DART Simulation', 'Launching Double Asteroid Redirection Test simulation...');
        
        // In a full implementation, this would start the DART visualization
        setTimeout(() => {
            this.addAlert('info', 'DART Simulation', 'DART impact successful! Asteroid trajectory altered.');
        }, 3000);
    }

    toggleAutoRotate() {
        const earth = this.app.getEarthGlobe();
        if (earth) {
            return earth.toggleAutoRotate();
        }
        return false;
    }

    toggleOrbits() {
        const asteroids = this.app.components.asteroids;
        if (asteroids) {
            const visible = !asteroids.orbitsGroup.visible;
            asteroids.toggleOrbitsVisibility(visible);
            return visible;
        }
        return false;
    }

    toggleLabels() {
        const asteroids = this.app.components.asteroids;
        if (asteroids) {
            asteroids.toggleLabelsVisibility(true); // Implementation needed
            return true;
        }
        return false;
    }

    showSettings() {
        // Simple settings modal
        const settingsHTML = `
            <div class="nasa-panel" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2000; width: 400px;">
                <div class="panel-header">
                    <h3 class="panel-title">SETTINGS</h3>
                    <button class="panel-close" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="panel-content">
                    <div class="setting-group">
                        <label>Graphics Quality:</label>
                        <select class="nasa-input">
                            <option>Low</option>
                            <option selected>Medium</option>
                            <option>High</option>
                        </select>
                    </div>
                    <div class="setting-group">
                        <label>Animation Speed:</label>
                        <input type="range" min="0.1" max="2" step="0.1" value="1" class="nasa-input">
                    </div>
                    <button class="nasa-button full-width">Save Settings</button>
                </div>
            </div>
        `;
        
        const settingsDiv = document.createElement('div');
        settingsDiv.innerHTML = settingsHTML;
        document.body.appendChild(settingsDiv);
    }

    updatePerformanceStats(stats) {
        // Update performance display if needed
        // This could update a small stats panel in the UI
    }

    handleAsteroidSelection(asteroidData) {
        this.app.selectAsteroid(asteroidData);
    }

    // Cleanup
    destroy() {
        // Remove all event listeners
        // Clean up any dynamically created elements
    }
}

export { UIManager };