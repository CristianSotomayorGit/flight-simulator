precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_texture;
uniform bool u_grayscale;

void main() {
    vec4 col = texture2D(u_texture, v_texCoord);
    if(u_grayscale) {
        float gray = dot(col.rgb, vec3(0.299, 0.587, 0.114));
        gl_FragColor = vec4(gray, gray, gray, col.a);
    } else {
        gl_FragColor = col;
    }
}