// Mathematical utilities for orbital mechanics and physics calculations
class MathUtils {
    static degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    static radiansToDegrees(radians) {
        return radians * (180 / Math.PI);
    }

    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    static smoothstep(edge0, edge1, x) {
        const t = MathUtils.clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
        return t * t * (3.0 - 2.0 * t);
    }

    // Vector operations
    static vectorLength(x, y, z = 0) {
        return Math.sqrt(x * x + y * y + z * z);
    }

    static normalizeVector(x, y, z = 0) {
        const length = MathUtils.vectorLength(x, y, z);
        if (length === 0) return { x: 0, y: 0, z: 0 };
        return {
            x: x / length,
            y: y / length,
            z: z / length
        };
    }

    static dotProduct(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    }

    static crossProduct(v1, v2) {
        return {
            x: v1.y * v2.z - v1.z * v2.y,
            y: v1.z * v2.x - v1.x * v2.z,
            z: v1.x * v2.y - v1.y * v2.x
        };
    }

    // Orbital mechanics
    static calculateOrbitalVelocity(semiMajorAxis, centralMass) {
        const G = 6.67430e-11;
        return Math.sqrt(G * centralMass / semiMajorAxis);
    }

    static calculateOrbitalPeriod(semiMajorAxis, centralMass) {
        const G = 6.67430e-11;
        return 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / (G * centralMass));
    }

    static keplerEquation(M, e, tolerance = 1e-6) {
        // Solve Kepler's equation: M = E - e * sin(E)
        let E = M;
        for (let i = 0; i < 50; i++) {
            const delta = E - e * Math.sin(E) - M;
            if (Math.abs(delta) < tolerance) break;
            E -= delta / (1 - e * Math.cos(E));
        }
        return E;
    }

    // Coordinate transformations
    static sphericalToCartesian(radius, theta, phi) {
        return {
            x: radius * Math.sin(theta) * Math.cos(phi),
            y: radius * Math.sin(theta) * Math.sin(phi),
            z: radius * Math.cos(theta)
        };
    }

    static cartesianToSpherical(x, y, z) {
        const radius = MathUtils.vectorLength(x, y, z);
        return {
            radius: radius,
            theta: Math.acos(z / radius),
            phi: Math.atan2(y, x)
        };
    }

    // Statistical functions
    static normalDistribution(x, mean = 0, stdDev = 1) {
        return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * 
               Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
    }

    static randomNormal(mean = 0, stdDev = 1) {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    // Interpolation
    static interpolateArray(values, factor) {
        const index = factor * (values.length - 1);
        const lowerIndex = Math.floor(index);
        const upperIndex = Math.ceil(index);
        const weight = index - lowerIndex;
        
        if (lowerIndex === upperIndex) return values[lowerIndex];
        return MathUtils.lerp(values[lowerIndex], values[upperIndex], weight);
    }

    // Unit conversions
    static kmToMeters(km) {
        return km * 1000;
    }

    static metersToKm(meters) {
        return meters / 1000;
    }

    static auToKm(au) {
        return au * 149597870.7;
    }

    static kmToAu(km) {
        return km / 149597870.7;
    }

    // Formatting utilities
    static formatScientific(number, precision = 2) {
        return number.toExponential(precision);
    }

    static formatLargeNumber(number) {
        if (number >= 1e12) return (number / 1e12).toFixed(2) + 'T';
        if (number >= 1e9) return (number / 1e9).toFixed(2) + 'B';
        if (number >= 1e6) return (number / 1e6).toFixed(2) + 'M';
        if (number >= 1e3) return (number / 1e3).toFixed(2) + 'K';
        return number.toFixed(2);
    }

    // Geometry calculations
    static calculateDistance(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        const dz = point2.z - point1.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    static calculateSphereVolume(radius) {
        return (4/3) * Math.PI * Math.pow(radius, 3);
    }

    static calculateCircleArea(radius) {
        return Math.PI * Math.pow(radius, 2);
    }
}

export { MathUtils };