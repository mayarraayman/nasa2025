// Mapbox Configuration
export const MAPBOX_CONFIG = {
    accessToken: 'pk.eyJ1IjoibWF5YXJyYWF5bWFuIiwiYSI6ImNtZ2FnYXhiczBzeDYyaXF3aTVpYXdodjgifQ.eXorIlV1O_IQqBMetJVShg',
    style: 'mapbox://styles/mapbox/satellite-v9', // Satellite view for space theme
    center: [0, 0], // Center on equator
    zoom: 2,
    pitch: 0,
    bearing: 0
};

// Initialize Mapbox with the access token
export function initializeMapbox() {
    if (typeof mapboxgl !== 'undefined') {
        mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;
        console.log('🗺️ Mapbox initialized with access token');
        return true;
    } else {
        console.warn('Mapbox GL JS not loaded');
        return false;
    }
}

// Create a map instance
export function createMap(containerId) {
    if (!initializeMapbox()) {
        return null;
    }

    try {
        const map = new mapboxgl.Map({
            container: containerId,
            style: MAPBOX_CONFIG.style,
            center: MAPBOX_CONFIG.center,
            zoom: MAPBOX_CONFIG.zoom,
            pitch: MAPBOX_CONFIG.pitch,
            bearing: MAPBOX_CONFIG.bearing,
            interactive: false // Disable interaction for overlay use
        });

        map.on('load', () => {
            console.log('🗺️ Map loaded successfully');
        });

        return map;
    } catch (error) {
        console.error('Failed to create map:', error);
        return null;
    }
}

// Add custom markers for asteroids
export function addAsteroidMarker(map, asteroid, coordinates) {
    if (!map) return null;

    const el = document.createElement('div');
    el.className = 'asteroid-marker';
    el.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: ${asteroid.hazardous ? '#ff4444' : '#4a9eff'};
        border: 2px solid #fff;
        box-shadow: 0 0 10px rgba(74, 158, 255, 0.5);
        cursor: pointer;
    `;

    const marker = new mapboxgl.Marker(el)
        .setLngLat(coordinates)
        .addTo(map);

    return marker;
}

// Update marker based on asteroid properties
export function updateAsteroidMarker(marker, asteroid) {
    if (!marker) return;

    const el = marker.getElement();
    if (el) {
        el.style.background = asteroid.hazardous ? '#ff4444' : '#4a9eff';
        el.style.width = `${Math.max(10, Math.min(30, asteroid.diameter * 10))}px`;
        el.style.height = `${Math.max(10, Math.min(30, asteroid.diameter * 10))}px`;
    }
}

// Convert asteroid orbital data to map coordinates
export function orbitalToMapCoordinates(asteroid) {
    if (!asteroid.orbit) {
        return [0, 0]; // Default to center
    }

    // Simplified conversion - in reality this would be more complex
    const longitude = (asteroid.orbit.semiMajorAxis - 1) * 180; // Rough conversion
    const latitude = asteroid.orbit.inclination || 0;

    return [longitude, latitude];
}

// Add orbit visualization
export function addOrbitVisualization(map, asteroid) {
    if (!map || !asteroid.orbit) return;

    const coordinates = orbitalToMapCoordinates(asteroid);
    
    // Add orbit line (simplified)
    map.addSource(`orbit-${asteroid.id}`, {
        type: 'geojson',
        data: {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: [
                    [coordinates[0] - 5, coordinates[1]],
                    [coordinates[0] + 5, coordinates[1]],
                    [coordinates[0], coordinates[1] + 5],
                    [coordinates[0], coordinates[1] - 5],
                    [coordinates[0] - 5, coordinates[1]]
                ]
            }
        }
    });

    map.addLayer({
        id: `orbit-${asteroid.id}`,
        type: 'line',
        source: `orbit-${asteroid.id}`,
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#4a9eff',
            'line-width': 2,
            'line-opacity': 0.6
        }
    });
}

// Remove orbit visualization
export function removeOrbitVisualization(map, asteroidId) {
    if (!map) return;

    if (map.getLayer(`orbit-${asteroidId}`)) {
        map.removeLayer(`orbit-${asteroidId}`);
    }
    if (map.getSource(`orbit-${asteroidId}`)) {
        map.removeSource(`orbit-${asteroidId}`);
    }
}

// Clean up map resources
export function cleanupMap(map) {
    if (map) {
        map.remove();
    }
}

