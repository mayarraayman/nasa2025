class ColorUtils {
    // NASA color palette
    static nasaColors = {
        primary: {
            blue: '#1e3c72',
            lightBlue: '#2a5298',
            cyan: '#4facfe',
            brightCyan: '#00f2fe'
        },
        status: {
            success: '#00b894',
            warning: '#fdcb6e',
            danger: '#ff4757',
            info: '#74b9ff'
        },
        ui: {
            background: '#0a1128',
            panel: 'rgba(10, 25, 47, 0.95)',
            border: 'rgba(64, 156, 255, 0.3)'
        }
    };

    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    static interpolateColor(color1, color2, factor) {
        if (typeof color1 === 'string') color1 = this.hexToRgb(color1);
        if (typeof color2 === 'string') color2 = this.hexToRgb(color2);

        const r = Math.round(color1.r + factor * (color2.r - color1.r));
        const g = Math.round(color1.g + factor * (color2.g - color1.g));
        const b = Math.round(color1.b + factor * (color2.b - color1.b));

        return this.rgbToHex(r, g, b);
    }

    static getThreatColor(threatLevel) {
        const colors = {
            low: this.nasaColors.status.success,
            medium: this.nasaColors.status.warning,
            high: this.nasaColors.status.danger,
            catastrophic: '#ff0000'
        };
        return colors[threatLevel] || this.nasaColors.status.info;
    }

    static getCompositionColor(composition) {
        const colors = {
            carbonaceous: '#8B4513', // Brown
            stony: '#A9A9A9',        // Gray
            metal: '#C0C0C0',        // Silver
            ice: '#87CEEB'           // Light blue
        };
        return colors[composition] || '#666666';
    }

    // Three.js material helpers
    static createAsteroidMaterial(composition) {
        const color = this.getCompositionColor(composition);
        const rgb = this.hexToRgb(color);
        
        return {
            color: new THREE.Color(color),
            emissive: new THREE.Color(rgb.r * 0.1, rgb.g * 0.1, rgb.b * 0.1),
            roughness: composition === 'metal' ? 0.3 : 0.8,
            metalness: composition === 'metal' ? 0.9 : 0.1
        };
    }

    static createGlowMaterial(baseColor, intensity = 1.0) {
        return {
            uniforms: {
                glowColor: { value: new THREE.Color(baseColor) },
                viewVector: { value: new THREE.Vector3() }
            },
            vertexShader: `
                uniform vec3 viewVector;
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    vec3 vNormel = normalize(normalMatrix * viewVector);
                    intensity = pow(0.7 - dot(vNormal, vNormel), 2.0);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;
                void main() {
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4(glow, intensity * 0.3);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        };
    }

    // CSS gradient generators
    static createPanelGradient() {
        return `linear-gradient(135deg, ${this.nasaColors.ui.panel} 0%, rgba(10, 35, 67, 0.95) 100%)`;
    }

    static createButtonGradient() {
        return `linear-gradient(135deg, ${this.nasaColors.primary.blue} 0%, ${this.nasaColors.primary.lightBlue} 100%)`;
    }

    static createGlowEffect(color) {
        return `
            0 0 10px ${color},
            0 0 20px ${color},
            0 0 30px ${color}
        `;
    }

    // Accessibility utilities
    static getContrastColor(backgroundColor) {
        const rgb = this.hexToRgb(backgroundColor);
        if (!rgb) return '#ffffff';
        
        // Calculate relative luminance
        const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        return luminance > 0.5 ? '#000000' : '#ffffff';
    }

    static ensureAccessibleContrast(foreground, background) {
        const fg = this.hexToRgb(foreground);
        const bg = this.hexToRgb(background);
        
        if (!fg || !bg) return foreground;
        
        // Calculate contrast ratio
        const l1 = this.calculateLuminance(fg);
        const l2 = this.calculateLuminance(bg);
        const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        
        // WCAG AA requires at least 4.5:1 for normal text
        if (contrast >= 4.5) return foreground;
        
        // Adjust color to meet contrast requirements
        return l1 > l2 ? this.darkenColor(foreground, 0.3) : this.lightenColor(foreground, 0.3);
    }

    static calculateLuminance(rgb) {
        const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    static darkenColor(color, factor) {
        const rgb = this.hexToRgb(color);
        if (!rgb) return color;
        
        return this.rgbToHex(
            Math.max(0, rgb.r * (1 - factor)),
            Math.max(0, rgb.g * (1 - factor)),
            Math.max(0, rgb.b * (1 - factor))
        );
    }

    static lightenColor(color, factor) {
        const rgb = this.hexToRgb(color);
        if (!rgb) return color;
        
        return this.rgbToHex(
            Math.min(255, rgb.r + (255 - rgb.r) * factor),
            Math.min(255, rgb.g + (255 - rgb.g) * factor),
            Math.min(255, rgb.b + (255 - rgb.b) * factor)
        );
    }

    // Animation utilities
    static createPulseAnimation(color) {
        return `
            @keyframes pulse {
                0%, 100% { 
                    box-shadow: 0 0 5px ${color};
                }
                50% { 
                    box-shadow: 0 0 20px ${color}, 0 0 30px ${color};
                }
            }
        `;
    }

    static createScanLineAnimation() {
        return `
            @keyframes scanline {
                0% {
                    transform: translateY(-100%);
                }
                100% {
                    transform: translateY(100vh);
                }
            }
        `;
    }
}

export { ColorUtils };