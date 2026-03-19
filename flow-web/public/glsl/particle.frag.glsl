varying float vSpeed;
uniform vec3 uFastColor;
uniform vec3 uSlowColor;

uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;
varying float vFogDepth;

void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float a = smoothstep(0.7, 0.0, d) * 0.1;

    float fac = smoothstep(0.0, 1.0, vSpeed);
    vec3 color = uFastColor * fac + uSlowColor * (1.0 - fac);

    float fogFactor = smoothstep(fogNear + ((fogNear + fogFar) / 4.0), fogFar, vFogDepth);

    vec3 finalColor = mix(color, fogColor, fogFactor);

    gl_FragColor = vec4(finalColor, a * (1.0 - fogFactor));
}