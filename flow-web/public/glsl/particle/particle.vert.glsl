#define MAX_PARTICLE_SIZE 70.0
#define MIN_PARTICLE_SIZE 2.0

// Camera parameters
uniform float uNear;
uniform float uFar;

// Particle speed (Normalized to permitted range)
attribute float speed;

varying float vSpeed;
varying float vDepth;

void main() {
    vSpeed = speed;

    vec4 mv_pos = modelViewMatrix * vec4(position, 1.0);
    vDepth = clamp(-mv_pos.z, uNear, uFar);

    gl_PointSize = clamp(MAX_PARTICLE_SIZE / vDepth, MIN_PARTICLE_SIZE, MAX_PARTICLE_SIZE);
    gl_Position = projectionMatrix * mv_pos;
}