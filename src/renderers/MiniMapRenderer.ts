export class MiniMapRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private positionBuffer: WebGLBuffer;
  private texCoordBuffer: WebGLBuffer;
  private checkpointBuffer: WebGLBuffer;
  private aPosition: GLint;
  private aTexCoord: GLint;
  private uAngle: WebGLUniformLocation | null;
  private uScale: WebGLUniformLocation | null;
  private uOffset: WebGLUniformLocation | null;
  private uGrayscale: WebGLUniformLocation | null;
  private uTexture: WebGLUniformLocation | null;
  private mapTexture: WebGLTexture | null;
  checkpointsMiniMap: Array<[number, number]> = [
    [0.505, 0.297],
    [0.417, 0.291],
    [0.318, 0.292],
    [0.3, 0.4],
    [0.417, 0.542],
    [0.355, 0.735],
    [0.289, 0.816],
    [0.285, 0.928],
    [0.335, 0.936],
    [0.5, 0.9],
  ];

  constructor(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    positionBuffer: WebGLBuffer,
    texCoordBuffer: WebGLBuffer,
    checkpointBuffer: WebGLBuffer,
    mapTexture: WebGLTexture | null
  ) {
    this.gl = gl;
    this.program = program;
    this.positionBuffer = positionBuffer;
    this.texCoordBuffer = texCoordBuffer;
    this.checkpointBuffer = checkpointBuffer;
    this.mapTexture = mapTexture;
    this.aPosition = gl.getAttribLocation(program, "a_position");
    this.aTexCoord = gl.getAttribLocation(program, "a_texCoord");
    this.uAngle = gl.getUniformLocation(program, "u_angle");
    this.uScale = gl.getUniformLocation(program, "u_scale");
    this.uOffset = gl.getUniformLocation(program, "u_offset");
    this.uGrayscale = gl.getUniformLocation(program, "u_grayscale");
    this.uTexture = gl.getUniformLocation(program, "u_texture");
  }

  draw(width: number, height: number) {
    const gl = this.gl;
    gl.viewport(0, 0, width, height);
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(this.aPosition);
    gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.enableVertexAttribArray(this.aTexCoord);
    gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1f(this.uAngle, 0);
    gl.uniform1f(this.uScale, 1);
    gl.uniform2f(this.uOffset, 0, 0);
    gl.uniform1i(this.uGrayscale, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.mapTexture);
    gl.uniform1i(this.uTexture, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  drawMiniMapPlane(
    colorProgram: WebGLProgram,
    crossBuffer: WebGLBuffer,
    offsetX: number,
    offsetY: number,
    angle: number
  ) {
    if (!this.gl || !colorProgram || !crossBuffer) return;
    const gl = this.gl;
    const mx = 2 * (0.5 + offsetX) - 1;
    const my = 2 * (0.5 + offsetY) - 1;
    const s = 0.05;
    const coords = [0, s, -s, -s, s, -s];
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const arr: number[] = [];
    for (let i = 0; i < coords.length; i += 2) {
      const rx = coords[i] * cosA - coords[i + 1] * sinA;
      const ry = coords[i] * sinA + coords[i + 1] * cosA;
      arr.push(rx + mx, ry + my);
    }
    const v = new Float32Array(arr);
    gl.bindBuffer(gl.ARRAY_BUFFER, crossBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, v, gl.DYNAMIC_DRAW);
    gl.useProgram(colorProgram);
    const aPos = gl.getAttribLocation(colorProgram, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const uColor = gl.getUniformLocation(colorProgram, "u_color");
    gl.uniform4f(uColor, 1, 0.5, 0, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  drawMiniMapCheckpoints(colorProgram: WebGLProgram) {
    if (!this.gl || !colorProgram) return;
    for (let i = 0; i < this.checkpointsMiniMap.length; i++) {
      const cp = this.checkpointsMiniMap[i];
      const sx = 2 * cp[0] - 1;
      const sy = 2 * cp[1] - 1;
      this.drawSquare(colorProgram, sx, sy, 0.04, [0, 1, 0, 1]);
    }
  }

  drawSquare(
    colorProgram: WebGLProgram,
    x: number,
    y: number,
    size: number,
    color: [number, number, number, number]
  ) {
    if (!this.gl || !colorProgram || !this.checkpointBuffer) return;
    const gl = this.gl;
    gl.useProgram(colorProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.checkpointBuffer);
    const half = size / 2;
    const verts = new Float32Array([
      x - half,
      y - half,
      x + half,
      y - half,
      x - half,
      y + half,
      x - half,
      y + half,
      x + half,
      y - half,
      x + half,
      y + half,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
    const aPos = gl.getAttribLocation(colorProgram, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const uColor = gl.getUniformLocation(colorProgram, "u_color");
    gl.uniform4f(uColor, color[0], color[1], color[2], color[3]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}
