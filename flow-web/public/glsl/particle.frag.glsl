varying float vSpeed;
uniform vec3 uFastColor;
uniform vec3 uSlowColor;

varying float vFocusT;

#define MIN_ALPHA 0.01
#define MAX_ALPHA 0.05

#define COLOR_INTENSITY 0.3

void main() {
    vec3 fastColor = uFastColor * COLOR_INTENSITY;
    vec3 slowColor = uSlowColor * COLOR_INTENSITY;

    // Circular point
    float d = length(gl_PointCoord - vec2(0.5));
    float a = smoothstep(0.5, 0.0, d);

    // Color based on speed
    float fac = smoothstep(0.0, 1.0, vSpeed);
    vec3 c = mix(slowColor, fastColor, fac);

    // Bokeh falloff
    float focusAlpha = max(1.0 - (vFocusT * vFocusT * vFocusT), MIN_ALPHA);
    vec4 finalColor = vec4(c, min(focusAlpha, MAX_ALPHA) * a);

    gl_FragColor = finalColor;
}