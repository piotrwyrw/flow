#define MIN_ALPHA 0.5
#define MAX_ALPHA 1.0

varying float vSpeed;
varying float vDepth;

uniform vec3 uFastColor;
uniform vec3 uSlowColor;

void main() {
    // Make the points circular
    vec2 center = vec2(0.5);
    float center_distance = length(gl_PointCoord - center);
    float shape = smoothstep(0.6, 0.0, center_distance);

    // Color particles based on speed
    float t = clamp(vSpeed, 0.0, 1.0);
    vec3 color = mix(uSlowColor, uFastColor, t);

    // TODO Bokeh
    float alpha = clamp(MAX_ALPHA / vDepth, MIN_ALPHA, MAX_ALPHA);

    gl_FragColor = vec4(color, shape * alpha);
}