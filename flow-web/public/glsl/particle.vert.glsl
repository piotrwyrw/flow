attribute float speed;
varying float vSpeed;

varying float vFogDepth;

void main() {
    vSpeed = speed;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vFogDepth = -mvPosition.z;

    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = 1.5;
}