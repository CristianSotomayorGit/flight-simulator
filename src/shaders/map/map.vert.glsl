attribute vec2 a_position;
attribute vec2 a_texCoord;
uniform float u_angle;
uniform float u_scale;
uniform vec2 u_offset;
varying vec2 v_texCoord;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    vec2 centered = a_texCoord - vec2(0.5, 0.5);
    float c = cos(u_angle);
    float s = sin(u_angle);
    vec2 rotated = vec2(c * centered.x - s * centered.y, s * centered.x + c * centered.y);
    rotated *= u_scale;
    v_texCoord = rotated + vec2(0.5, 0.5) + u_offset;
}