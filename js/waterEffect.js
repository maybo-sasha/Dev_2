import * as THREE from "three";
import { Effect } from "postprocessing";

// Vertex Shader
const vertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv; // Pass UV coordinates to the fragment shader
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); // Standard transformation
}
`;

// Fragment Shader
const fragmentShader = `
varying vec2 vUv;

#define PI 3.14159265359

void mainUv(inout vec2 uv) {
    float time = mod(u_time, 100.0); // Use time to create dynamic distortion
    float vx = sin(uv.y * 10.0 + time) * 0.01; // Sine distortion on x-axis
    float vy = cos(uv.x * 10.0 + time) * 0.01; // Cosine distortion on y-axis
    uv.x += vx;
    uv.y += vy;
}

void main() {
    vec2 distortedUv = vUv; // Create a distorted version of the UV coordinates
    mainUv(distortedUv); // Apply distortion to the UVs

    // Add simple color gradient
    vec3 color = vec3(distortedUv.x, distortedUv.y, 1.0);
    gl_FragColor = vec4(color, 1.0); // Output the final color
}
`;

// WaterEffect Class
export class WaterEffect extends Effect {
    constructor(options = {}) {
        super("WaterEffect", fragmentShader, {
            uniforms: new Map([
                ["u_time", new THREE.Uniform(0.0)], // Add time uniform for animation
            ]),
            vertexShader, // Pass the vertex shader
        });

        // Keep track of time for the effect
        this.clock = new THREE.Clock();
    }

    update() {
        // Update the time uniform
        this.uniforms.get("u_time").value = this.clock.getElapsedTime();
    }
}

export default WaterEffect;
