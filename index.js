// Import Three.js and loaders as modules
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GoogleEarthApp } from './src/googleEarthApp.js';
import { NASATheme } from './src/nasaTheme.js';

// Apply NASA theme first
NASATheme.applyGlobalStyles();

class OBLIVARA {
  constructor() {
    this.googleEarthApp = null;
    this.isInitialized = false;
    this.gltfLoader = null;
    this.dracoLoader = null;
    
    // Initialize loaders with proper error handling
    this.initializeLoaders();
    this.init();
  }

  initializeLoaders() {
    try {
      // Initialize DRACOLoader first (GLB files often use Draco compression)
      this.dracoLoader = new DRACOLoader();
      
      // Set the path to the Draco decoder files
      this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      
      // Initialize GLTFLoader with DRACOLoader (GLTFLoader also handles GLB files)
      this.gltfLoader = new GLTFLoader();
      this.gltfLoader.setDRACOLoader(this.dracoLoader);
      
      console.log('✅ GLTFLoader and DRACOLoader initialized for GLB files');
    } catch (error) {
      console.error('❌ Loader initialization failed:', error);
      this.initializeFallbackLoader();
    }
  }

  initializeFallbackLoader() {
    try {
      // Fallback: GLTFLoader without Draco (for non-compressed GLB files)
      this.gltfLoader = new GLTFLoader();
      console.warn('⚠️ Using GLTFLoader without Draco compression support');
    } catch (error) {
      console.error('❌ Fallback loader also failed:', error);
      this.gltfLoader = null;
    }
  }

  async init() {
    try {
      this.updateLoadingStatus('Initializing Google Earth engine...', 10);
      
      // Pass THREE and loaders to GoogleEarthApp
      this.googleEarthApp = new GoogleEarthApp('earth-container', THREE, this.gltfLoader);
      await this.googleEarthApp.initialize();
      
      this.updateLoadingStatus('Loading planetary data...', 30);
      await this.googleEarthApp.loadAsteroidData();
      
      this.updateLoadingStatus('Setting up defense systems...', 50);
      await this.setupDefenseSystems();
      
      this.updateLoadingStatus('Loading 3D models...', 70);
      await this.load3DModels();
      
      this.updateLoadingStatus('Initializing user interface...', 85);
      await this.setupControls();
      
      this.updateLoadingStatus('Ready for planetary defense!', 100);
      
      setTimeout(() => {
        this.hideLoadingScreen();
        this.isInitialized = true;
        this.onInitializationComplete();
      }, 1000);
      
    } catch (error) {
      console.error('❌ OBLIVARA initialization failed:', error);
      this.showErrorScreen(error);
    }
  }

  async load3DModels() {
    if (!this.gltfLoader) {
      console.warn('⚠️ GLTFLoader not available, creating fallback models only');
      await this.createAllFallbackModels();
      return;
    }

    try {
      // Updated paths to use .glb extension
      const modelsToLoad = [
        { path: './assets/models/satellite.glb', name: 'satellite', type: 'glb' },
        // Reuse satellite model for defense system
        { path: './assets/models/satellite.glb', name: 'defenseSystem', type: 'glb' },
        // Use existing asteroid variants only
        { path: './assets/models/earth.glb', name: 'earth', type: 'glb' },
        { path: './assets/models/asteroid_rock.glb', name: 'asteroid_rock', type: 'glb' },
        { path: './assets/models/asteroid_metal.glb', name: 'asteroid_metal', type: 'glb' }
      ];

      let loadedCount = 0;
      const totalModels = modelsToLoad.length;

      for (const model of modelsToLoad) {
        const exists = await this.checkModelExists(model.path);
        if (exists) {
          await this.loadGLBModel(model.path, model.name);
          loadedCount++;
          this.updateModelLoadingProgress(loadedCount, totalModels, model.name);
        } else {
          console.warn(`📁 GLB model file not found: ${model.path}`);
          await this.createFallbackModel(model.name);
          loadedCount++;
        }
      }
      
      console.log(`✅ ${loadedCount}/${totalModels} 3D models processed successfully`);
    } catch (error) {
      console.warn('⚠️ Model loading had issues, using fallbacks:', error);
      await this.createAllFallbackModels();
    }
  }

  async checkModelExists(url) {
    try {
      const resolved = new URL(url, import.meta.url).href;
      const response = await fetch(resolved, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  loadGLBModel(path, name) {
    return new Promise((resolve, reject) => {
      const resolved = new URL(path, import.meta.url).href;
      this.gltfLoader.load(
        resolved,
        (gltf) => {
          console.log(`✅ ${name}.glb loaded successfully`);
          this.handleLoadedModel(gltf, name);
          resolve(gltf);
        },
        (progress) => {
          const percent = (progress.loaded / progress.total * 100).toFixed(1);
          // Only log significant progress updates to reduce spam
          if (percent % 25 === 0) {
            console.log(`📦 Loading ${name}.glb: ${percent}%`);
          }
        },
        (error) => {
          console.error(`❌ Failed to load ${name}.glb:`, error);
          console.warn(`🔄 Creating fallback for ${name} due to load error`);
          this.createFallbackModel(name).then(resolve).catch(reject);
        }
      );
    });
  }

  updateModelLoadingProgress(loaded, total, currentModel) {
    const progress = 70 + Math.floor((loaded / total) * 25); // 70-95% range for model loading
    this.updateLoadingStatus(`Loading 3D models... (${loaded}/${total}) - ${currentModel}`, progress);
  }

  async createAllFallbackModels() {
    console.log('🔄 Creating all fallback models');
    
    const fallbackModels = [
      'satellite',
      'defenseSystem', 
      'asteroid',
      'earth',
      'asteroid_rock',
      'asteroid_metal'
    ];

    for (const modelName of fallbackModels) {
      await this.createFallbackModel(modelName);
    }
    
    console.log('✅ All fallback models created');
  }

  createFallbackModel(name) {
    return new Promise((resolve) => {
      console.log(`🔄 Creating fallback geometry for ${name}`);
      
      let geometry, material, scale = 1;
      
      switch (name) {
        case 'satellite':
          geometry = new THREE.BoxGeometry(0.3, 0.1, 0.1);
          material = new THREE.MeshPhongMaterial({ 
            color: 0x4444ff, 
            emissive: 0x222266,
            shininess: 100 
          });
          break;
        case 'defenseSystem':
          geometry = new THREE.ConeGeometry(0.2, 0.6, 8);
          material = new THREE.MeshPhongMaterial({ 
            color: 0xff4444, 
            emissive: 0x662222,
            shininess: 80 
          });
          break;
        case 'asteroid':
          geometry = new THREE.SphereGeometry(0.4, 8, 6);
          material = new THREE.MeshPhongMaterial({ 
            color: 0x888888, 
            emissive: 0x333333 
          });
          break;
        case 'asteroid_rock':
          geometry = new THREE.SphereGeometry(0.3, 6, 4);
          material = new THREE.MeshPhongMaterial({ 
            color: 0x996633, 
            emissive: 0x442211 
          });
          break;
        case 'asteroid_metal':
          geometry = new THREE.OctahedronGeometry(0.35, 1);
          material = new THREE.MeshPhongMaterial({ 
            color: 0xaaaaaa, 
            emissive: 0x666666,
            shininess: 120 
          });
          break;
        case 'earth':
          // Earth is already handled by texture-based system, so skip or create simple sphere
          geometry = new THREE.SphereGeometry(1, 32, 32);
          material = new THREE.MeshPhongMaterial({ 
            color: 0x2233ff,
            emissive: 0x112266 
          });
          scale = 0; // Make invisible since we have textured earth
          break;
        default:
          geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
          material = new THREE.MeshPhongMaterial({ color: 0xffffff });
      }
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.setScalar(scale);
      
      // Add some variation for asteroids
      if (name.includes('asteroid')) {
        mesh.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI, 
          Math.random() * Math.PI
        );
      }
      
      const fallbackModel = { 
        scene: mesh,
        isFallback: true,
        name: name
      };
      
      this.handleLoadedModel(fallbackModel, name);
      resolve(fallbackModel);
    });
  }

  handleLoadedModel(gltf, name) {
          // Store the loaded model for later use
          if (!this.googleEarthApp.loadedModels) {
            this.googleEarthApp.loadedModels = {};
          }
          this.googleEarthApp.loadedModels[name] = gltf;
          
    // Add to scene if it's a satellite or defense system (and not earth)
    if ((name === 'satellite' || name === 'defenseSystem') && name !== 'earth') {
      if (this.googleEarthApp.addToScene) {
            this.googleEarthApp.addToScene(gltf.scene);
      } else if (this.googleEarthApp.scene && this.googleEarthApp.scene.add) {
        // Position in space around earth
        gltf.scene.position.set(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3
        );
        this.googleEarthApp.scene.add(gltf.scene);
      }
    }
    
    // Store asteroids for later spawning
    if (name.includes('asteroid')) {
      if (!this.googleEarthApp.asteroidTemplates) {
        this.googleEarthApp.asteroidTemplates = [];
      }
      this.googleEarthApp.asteroidTemplates.push(gltf.scene.clone());
    }
  }

  async setupDefenseSystems() {
    try {
      // Initialize defense systems with the Google Earth app
      if (this.googleEarthApp && typeof this.googleEarthApp.setupDefenseSystems === 'function') {
        await this.googleEarthApp.setupDefenseSystems();
      }
      
      console.log('🛡️ Defense systems ready');
    } catch (error) {
      console.warn('⚠️ Defense systems setup had issues:', error);
    }
  }

  async setupControls() {
    try {
      // Setup Google Earth controls
      this.setupGoogleEarthControls();
      
      // Setup keyboard controls
      this.setupKeyboardControls();
      
      console.log('🎮 Control systems initialized');
    } catch (error) {
      console.warn('⚠️ Control setup had issues:', error);
    }
  }

  setupGoogleEarthControls() {
    const setupControl = (id, callback) => {
      const element = document.getElementById(id);
      if (element && this.googleEarthApp) {
        element.addEventListener('click', () => {
          if (typeof this.googleEarthApp[callback] === 'function') {
            this.googleEarthApp[callback]();
          }
        });
      }
    };

    setupControl('zoom-in', 'zoomIn');
    setupControl('zoom-out', 'zoomOut');
    setupControl('reset-view', 'resetView');
    setupControl('toggle-orbits', 'toggleOrbits');
    setupControl('audio-toggle', 'toggleAudio');
  }

  setupKeyboardControls() {
    document.addEventListener('keydown', (event) => {
      if (!this.googleEarthApp) return;

      switch (event.key) {
        case '+':
        case '=':
          if (this.googleEarthApp.zoomIn) this.googleEarthApp.zoomIn();
          break;
        case '-':
        case '_':
          if (this.googleEarthApp.zoomOut) this.googleEarthApp.zoomOut();
          break;
        case 'r':
        case 'R':
          if (this.googleEarthApp.resetView) this.googleEarthApp.resetView();
          break;
        case 'o':
        case 'O':
          if (this.googleEarthApp.toggleOrbits) this.googleEarthApp.toggleOrbits();
          break;
        case 'm':
        case 'M':
          if (this.googleEarthApp.toggleAudio) this.googleEarthApp.toggleAudio();
          break;
      }
    });
  }

  onInitializationComplete() {
    console.log('🎉 OBLIVARA fully initialized and ready');
    
    // Start any ongoing processes
    this.startPlanetaryMonitoring();
  }

  startPlanetaryMonitoring() {
    // Start continuous monitoring of asteroids and threats
    setInterval(() => {
      if (this.googleEarthApp && this.isInitialized) {
        if (this.googleEarthApp.updateAsteroidPositions) {
        this.googleEarthApp.updateAsteroidPositions();
        }
        if (this.googleEarthApp.checkCollisions) {
        this.googleEarthApp.checkCollisions();
      }
      }
    }, 1000);
  }

  updateLoadingStatus(message, progress) {
    const statusElement = document.getElementById('loadingStatus');
    const progressElement = document.getElementById('loadingProgress');
    
    if (statusElement) statusElement.textContent = message;
    if (progressElement) progressElement.style.width = `${progress}%`;
    
    console.log(`📊 ${message} (${progress}%)`);
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }
  }

  showErrorScreen(error) {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.innerHTML = `
        <div style="text-align: center; color: #ff4757;">
          <div style="font-size: 2rem; margin-bottom: 1rem;">🚨 SYSTEM ERROR</div>
          <div style="font-size: 1rem; margin-bottom: 2rem; font-family: 'Space Grotesk', sans-serif;">
            ${error.message || 'Unknown error occurred'}
          </div>
          <div style="font-size: 0.8rem; margin-bottom: 2rem; color: #888; font-family: 'Space Grotesk', sans-serif;">
            Check console for details
          </div>
          <button onclick="location.reload()" style="
            background: linear-gradient(135deg, #ff4757, #ff3742);
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            color: white;
            cursor: pointer;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1rem;
            transition: transform 0.2s ease;
          ">RESTART SYSTEM</button>
        </div>
      `;
    }
  }

  // Cleanup method
  dispose() {
    if (this.dracoLoader) {
      this.dracoLoader.dispose();
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Starting OBLIVARA Planetary Defense System...');
  
  // Global error handler
  window.addEventListener('error', (event) => {
    console.error('🌍 Global error:', event.error);
  });
  
  // Initialize the application
  const oblivara = new OBLIVARA();
  
  // Export for debugging and external access
  window.oblivara = oblivara;
});