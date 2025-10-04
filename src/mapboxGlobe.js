const mapboxgl = window.mapboxgl;

class MapboxGlobe {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = null;
        this.map = null;
        this.isInitialized = false;
        
        // Configuration
        this.config = {
            accessToken: options.accessToken || 'pk.eyJ1IjoibWF5YXJyYWF5bWFuIiwiYSI6ImNtZ2FnYXhiczBzeDYyaXF3aTVpYXdodjgifQ.eXorIlV1O_IQqBMetJVShg',
            style: 'mapbox://styles/mapbox/satellite-v9',
            center: [-122.4194, 37.7749], // San Francisco coordinates
            zoom: 2,
            pitch: 45,
            bearing: 0,
            projection: 'globe'
        };
        
        // Layers state
        this.layers = {
            basic: true,
            polygon: true,
            color: true,
            polygonHeight: 50,
            enableHeight: true,
            polygonStroke: true,
            polygonScale: 1,
            elevationScale: 1,
            highPrecisionRendering: true
        };
        
        // Threat data
        this.threats = [];
        this.asteroids = [];
        
        // Animation properties
        this.isAnimating = false;
        this.animationFrame = null;
        
        this.setupMapbox();
    }
    
    setupMapbox() {
        mapboxgl.accessToken = this.config.accessToken;
    }
    
    async initialize() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            throw new Error(`Container ${this.containerId} not found`);
        }
        
        this.map = new mapboxgl.Map({
            container: this.containerId,
            style: this.config.style,
            center: this.config.center,
            zoom: this.config.zoom,
            pitch: this.config.pitch,
            bearing: this.config.bearing,
            projection: this.config.projection,
            antialias: true,
            maxZoom: 18,
            minZoom: 0.5
        });
        
        await new Promise((resolve) => {
            this.map.on('load', resolve);
        });
        await this.setupGlobeView();
        await this.setup3DLayers();
        await this.setupThreatVisualization();
        await this.setupInteractions();
        
        this.isInitialized = true;
        return this.map;
    }
    
    async setupGlobeView() {
        // Enable 3D terrain
        this.map.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
        });
        
        this.map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
        
        // Set up fog for atmosphere effect
        this.map.setFog({
            'color': '#0a0f1a', // Space-like color
            'high-color': '#245cdf', // Blue atmosphere
            'horizon-blend': 0.4,
            'space-color': '#000000',
            'star-intensity': 0.8
        });
        
        // Add atmospheric glow
        this.map.addLayer({
            'id': 'sky',
            'type': 'sky',
            'paint': {
                'sky-type': 'atmosphere',
                'sky-atmosphere-sun-intensity': 5,
                'sky-atmosphere-color': 'rgba(85, 151, 210, 0.5)',
                'sky-atmosphere-halo-color': 'rgba(255, 255, 255, 0.6)'
            }
        });
        
    }
    
    async setup3DLayers() {
        this.map.on('sourcedata', (e) => {
            if (e.sourceId === 'composite' && e.isSourceLoaded) {
                if (!this.map.getLayer('3d-buildings')) {
                    this.map.addLayer({
                        'id': '3d-buildings',
                        'source': 'composite',
                        'source-layer': 'building',
                        'filter': ['==', 'extrude', 'true'],
                        'type': 'fill-extrusion',
                        'minzoom': 10,
                        'paint': {
                            'fill-extrusion-color': [
                                'interpolate',
                                ['linear'],
                                ['get', 'height'],
                                0, '#4a90e2',
                                50, '#5aa3f0',
                                100, '#6bb6ff',
                                200, '#7cc9ff'
                            ],
                            'fill-extrusion-height': [
                                'interpolate',
                                ['linear'],
                                ['zoom'],
                                10, 0,
                                10.5, ['get', 'height']
                            ],
                            'fill-extrusion-base': [
                                'interpolate',
                                ['linear'],
                                ['zoom'],
                                10, 0,
                                10.5, ['get', 'min_height']
                            ],
                            'fill-extrusion-opacity': 0.8
                        }
                    });
                }
            }
        });
        
        this.addCityLabels();
    }
    
    addCityLabels() {
        // Major cities data
        const cities = [
            { name: 'San Francisco', coords: [-122.4194, 37.7749] },
            { name: 'New York', coords: [-74.0059, 40.7128] },
            { name: 'London', coords: [-0.1276, 51.5074] },
            { name: 'Tokyo', coords: [139.6917, 35.6895] },
            { name: 'Sydney', coords: [151.2093, -33.8688] },
            { name: 'Moscow', coords: [37.6173, 55.7558] }
        ];
        
        // Add city markers
        cities.forEach(city => {
            const el = document.createElement('div');
            el.className = 'city-marker';
            el.innerHTML = `
                <div class="city-label">
                    <div class="city-name">${city.name}</div>
                    <div class="city-pulse"></div>
                </div>
            `;
            
            new mapboxgl.Marker(el)
                .setLngLat(city.coords)
                .addTo(this.map);
        });
    }
    
    async setupThreatVisualization() {
        // Add threat sources
        this.map.addSource('threats', {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': []
            }
        });
        
        // Add asteroid threat visualization
        this.map.addSource('asteroids', {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': []
            }
        });
        
        // Threat beam layers (like the red laser in screenshots)
        this.map.addLayer({
            'id': 'threat-beams',
            'type': 'line',
            'source': 'threats',
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': '#ff4444',
                'line-width': 4,
                'line-opacity': 0.8,
                'line-blur': 2
            }
        });
        
        // Asteroid markers
        this.map.addLayer({
            'id': 'asteroid-markers',
            'type': 'circle',
            'source': 'asteroids',
            'paint': {
                'circle-radius': [
                    'interpolate',
                    ['linear'],
                    ['get', 'threat_level'],
                    1, 6,
                    5, 20
                ],
                'circle-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'threat_level'],
                    1, '#ffaa00',
                    3, '#ff6600',
                    5, '#ff0000'
                ],
                'circle-opacity': 0.8,
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 2
            }
        });
    }
    
    async setupInteractions() {
        // Mouse cursor changes
        this.map.on('mouseenter', 'asteroid-markers', () => {
            this.map.getCanvas().style.cursor = 'pointer';
        });
        
        this.map.on('mouseleave', 'asteroid-markers', () => {
            this.map.getCanvas().style.cursor = '';
        });
        
        // Click events for asteroids
        this.map.on('click', 'asteroid-markers', (e) => {
            if (e.features.length > 0) {
                const feature = e.features[0];
                this.showAsteroidPopup(feature, e.lngLat);
            }
        });
    }
    
    showAsteroidPopup(feature, lngLat) {
        const props = feature.properties;
        const popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            className: 'threat-popup'
        })
        .setLngLat(lngLat)
        .setHTML(`
            <div class="popup-content">
                <div class="popup-header">
                    <h3>${props.name || 'Asteroid Object'}</h3>
                    <span class="threat-level threat-${props.threat_level}">${this.getThreatLevelText(props.threat_level)}</span>
                </div>
                <div class="popup-details">
                    <div class="detail-row">
                        <span>Diameter:</span>
                        <span>${props.diameter || '0.5'} km</span>
                    </div>
                    <div class="detail-row">
                        <span>Velocity:</span>
                        <span>${props.velocity || '25'} km/s</span>
                    </div>
                    <div class="detail-row">
                        <span>Distance:</span>
                        <span>${props.distance || '15M'} km</span>
                    </div>
                    <div class="detail-row">
                        <span>Impact Probability:</span>
                        <span>${props.probability || '0.0001'}%</span>
                    </div>
                </div>
                <button class="popup-action-btn">Simulate Impact</button>
            </div>
        `)
        .addTo(this.map);
    }
    
    getThreatLevelText(level) {
        const levels = {
            1: 'LOW',
            2: 'MODERATE',
            3: 'HIGH',
            4: 'SEVERE',
            5: 'CRITICAL'
        };
        return levels[level] || 'UNKNOWN';
    }
    
    // Add threat beam (like the red laser in screenshots)
    addThreatBeam(startCoords, endCoords, threatLevel = 3) {
        const beamFeature = {
            'type': 'Feature',
            'properties': {
                'threat_level': threatLevel
            },
            'geometry': {
                'type': 'LineString',
                'coordinates': [startCoords, endCoords]
            }
        };
        
        const currentData = this.map.getSource('threats')._data;
        currentData.features.push(beamFeature);
        this.map.getSource('threats').setData(currentData);
        
        // Animate the beam
        this.animateThreatBeam(beamFeature);
    }
    
    animateThreatBeam(beamFeature) {
        let opacity = 0.8;
        let direction = -1;
        
        const animate = () => {
            opacity += direction * 0.02;
            if (opacity <= 0.3) direction = 1;
            if (opacity >= 0.9) direction = -1;
            
            this.map.setPaintProperty('threat-beams', 'line-opacity', opacity);
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    // Add asteroid marker
    addAsteroid(coords, properties = {}) {
        const asteroidFeature = {
            'type': 'Feature',
            'properties': {
                'name': properties.name || `Asteroid ${Date.now()}`,
                'threat_level': properties.threat_level || 2,
                'diameter': properties.diameter || Math.random() * 2 + 0.1,
                'velocity': properties.velocity || Math.random() * 30 + 10,
                'distance': properties.distance || Math.random() * 50 + 5,
                'probability': properties.probability || (Math.random() * 0.1).toFixed(4)
            },
            'geometry': {
                'type': 'Point',
                'coordinates': coords
            }
        };
        
        const currentData = this.map.getSource('asteroids')._data;
        currentData.features.push(asteroidFeature);
        this.map.getSource('asteroids').setData(currentData);
        
        this.asteroids.push(asteroidFeature);
        return asteroidFeature;
    }
    
    // Demo: Add some sample threats and asteroids
    addDemoThreats() {
        
        // Add threat beam like in screenshots (space to San Francisco)
        this.addThreatBeam(
            [-180, 85], // From space
            [-122.4194, 37.7749], // To San Francisco
            4
        );
        
        // Add some asteroid markers
        const demoAsteroids = [
            {
                coords: [-100, 40],
                props: { name: 'Bennu', threat_level: 3, diameter: 0.49 }
            },
            {
                coords: [0, 50],
                props: { name: 'Apophis', threat_level: 4, diameter: 0.37 }
            },
            {
                coords: [120, -20],
                props: { name: '2022 AP7', threat_level: 2, diameter: 1.5 }
            }
        ];
        
        demoAsteroids.forEach(asteroid => {
            this.addAsteroid(asteroid.coords, asteroid.props);
        });
    }
    
    // Camera controls
    flyToLocation(coords, zoom = 8, pitch = 60, bearing = 0) {
        this.map.flyTo({
            center: coords,
            zoom: zoom,
            pitch: pitch,
            bearing: bearing,
            duration: 2000,
            essential: true
        });
    }
    
    resetView() {
        this.map.flyTo({
            center: this.config.center,
            zoom: this.config.zoom,
            pitch: this.config.pitch,
            bearing: this.config.bearing,
            duration: 1500
        });
    }
    
    // Layer controls
    toggleLayer(layerName, visible) {
        if (this.map.getLayer(layerName)) {
            this.map.setLayoutProperty(layerName, 'visibility', visible ? 'visible' : 'none');
        }
    }
    
    updateLayerProperty(layerId, property, value) {
        if (this.map.getLayer(layerId)) {
            this.map.setPaintProperty(layerId, property, value);
        }
    }
    
    // Control methods for UI integration
    addThreatBeams() {
        this.addDemoThreats();
    }
    
    flyToSanFrancisco() {
        this.flyToLocation([-122.4194, 37.7749], 12, 60, 0);
    }
    
    showImpactBeams() {
        this.addThreatBeam(
            [-180, 85], // From space
            [-122.4194, 37.7749], // To San Francisco
            5 // Critical threat level
        );
    }
    
    updatePolygonHeight(height) {
        this.layers.polygonHeight = height;
        // Update 3D buildings height based on slider
        if (this.map.getLayer('3d-buildings')) {
            this.map.setPaintProperty('3d-buildings', 'fill-extrusion-height', [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 0,
                10.5, ['*', ['get', 'height'], height / 50]
            ]);
        }
    }
    
    updatePolygonScale(scale) {
        this.layers.polygonScale = scale;
        // Update building scale based on slider
        if (this.map.getLayer('3d-buildings')) {
            this.map.setPaintProperty('3d-buildings', 'fill-extrusion-opacity', Math.min(scale, 1));
        }
    }
    
    updateElevationScale(scale) {
        this.layers.elevationScale = scale;
        if (this.map.getSource('mapbox-dem')) {
            this.map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': scale });
        }
    }
    
    updateImpactIntensity(intensity) {
        this.impactIntensity = intensity;
        if (this.map.getLayer('threat-beams')) {
            this.map.setPaintProperty('threat-beams', 'line-width', intensity * 2);
            this.map.setPaintProperty('threat-beams', 'line-opacity', Math.min(intensity / 10 + 0.3, 1));
        }
    }
    
    simulateImpact() {
        const sanFrancisco = [-122.4194, 37.7749];
        const spaceCoords = [-122.4194, 85];
        
        this.addThreatBeam(spaceCoords, sanFrancisco, 5);
        this.flyToLocation(sanFrancisco, 10, 45, 0);
        
        setTimeout(() => {
            this.createImpactEffect(sanFrancisco);
        }, 2000);
    }
    
    createImpactEffect(coords) {
        const impactRadius = 0.1;
        const impactCircle = {
            'type': 'Feature',
            'properties': { 'impact': true },
            'geometry': {
                'type': 'Point',
                'coordinates': coords
            }
        };
        
        if (!this.map.getSource('impact-effects')) {
            this.map.addSource('impact-effects', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': []
                }
            });
            
            this.map.addLayer({
                'id': 'impact-effects',
                'type': 'circle',
                'source': 'impact-effects',
                'paint': {
                    'circle-radius': 20,
                    'circle-color': '#ff4444',
                    'circle-opacity': 0.8,
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 2
                }
            });
        }
        
        const currentData = this.map.getSource('impact-effects')._data;
        currentData.features.push(impactCircle);
        this.map.getSource('impact-effects').setData(currentData);
    }
    
    addRandomAsteroid() {
        const randomCoords = [
            Math.random() * 360 - 180,
            Math.random() * 140 - 70
        ];
        
        const asteroidNames = ['Ceres', 'Vesta', 'Pallas', 'Hygiea', 'Iris', 'Flora'];
        const randomName = asteroidNames[Math.floor(Math.random() * asteroidNames.length)];
        
        this.addAsteroid(randomCoords, {
            name: randomName,
            threat_level: Math.floor(Math.random() * 5) + 1,
            diameter: Math.random() * 5 + 0.1,
            velocity: Math.random() * 30 + 15
        });
    }
    
    toggleMapLayer(layerName, visible) {
        this.layers[layerName] = visible;
        
        switch(layerName) {
            case 'basic':
                this.toggleLayer('3d-buildings', visible);
                break;
            case 'polygon':
                this.toggleLayer('3d-buildings', visible);
                break;
            case 'color':
                // Toggle color schemes
                break;
            case 'high-precision':
                // Toggle high precision rendering
                break;
        }
    }
    
    // Handle resize
    handleResize() {
        if (this.map) {
            this.map.resize();
        }
    }
    
    // Cleanup
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.map) {
            this.map.remove();
        }
    }
}

export { MapboxGlobe };