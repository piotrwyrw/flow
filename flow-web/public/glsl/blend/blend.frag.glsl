
varying vec2 vUv;
uniform sampler2D uFrame;

void main() {
    vec4 color = texture(uFrame, vUv);
    gl_FragColor = color;
}