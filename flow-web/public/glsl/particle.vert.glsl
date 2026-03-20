#define FOCUS_DISTANCE 50.0
#define FOCUS_RANGE 100.0
#define MAX_PARTICLE_SIZE 80.0
#define MIN_PARTICLE_SIZE 4.0

attribute float speed;

varying float vSpeed;
varying float vFocusT;

void main() {
    vSpeed = speed;

    // Compute the depth of the particle wrt. to the camera
    vec4 mv_pos = modelViewMatrix * vec4(position, 1.0);
    float depth = -mv_pos.z;

    vFocusT = clamp(abs((depth - FOCUS_DISTANCE) / FOCUS_RANGE), 0.0, 1.0);

    // Calculate particle size with a cubic falloff
    float particle_size = MIN_PARTICLE_SIZE + (MAX_PARTICLE_SIZE - MIN_PARTICLE_SIZE) * (vFocusT * vFocusT * vFocusT);

    gl_Position = projectionMatrix * mv_pos;
    gl_PointSize = particle_size;
}