export class MapRenderer {
    private gl: WebGLRenderingContext;
    private program: WebGLProgram;
    private positionBuffer: WebGLBuffer;
    private texCoordBuffer: WebGLBuffer;
    private uAngle: WebGLUniformLocation | null;
    private uScale: WebGLUniformLocation | null;
    private uOffset: WebGLUniformLocation | null;
    private uTexture: WebGLUniformLocation | null;
    private uGrayscale: WebGLUniformLocation | null;
    private aPosition: GLint;
    private aTexCoord: GLint;
    private mapTexture: WebGLTexture | null;
  
    constructor(
      gl: WebGLRenderingContext,
      program: WebGLProgram,
      positionBuffer: WebGLBuffer,
      texCoordBuffer: WebGLBuffer,
      mapTexture: WebGLTexture | null
    ) {
      this.gl = gl;
      this.program = program;
      this.positionBuffer = positionBuffer;
      this.texCoordBuffer = texCoordBuffer;
      this.mapTexture = mapTexture;
      this.aPosition = gl.getAttribLocation(program, "a_position");
      this.aTexCoord = gl.getAttribLocation(program, "a_texCoord");
      this.uAngle = gl.getUniformLocation(program, "u_angle");
      this.uScale = gl.getUniformLocation(program, "u_scale");
      this.uOffset = gl.getUniformLocation(program, "u_offset");
      this.uTexture = gl.getUniformLocation(program, "u_texture");
      this.uGrayscale = gl.getUniformLocation(program, "u_grayscale");
    }
  
    draw(angle: number, scale: number, offsetX: number, offsetY: number, grayscale: boolean) {
      const gl = this.gl;
      gl.useProgram(this.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.enableVertexAttribArray(this.aPosition);
      gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
      gl.enableVertexAttribArray(this.aTexCoord);
      gl.vertexAttribPointer(this.aTexCoord, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(this.uAngle, angle);
      gl.uniform1f(this.uScale, scale);
      gl.uniform2f(this.uOffset, offsetX, offsetY);
      gl.uniform1i(this.uGrayscale, grayscale ? 1 : 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.mapTexture);
      gl.uniform1i(this.uTexture, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    drawSquare(
      colorProgram: WebGLProgram,
      checkpointBuffer: WebGLBuffer,
      x: number,
      y: number,
      size: number,
      color: [number, number, number, number]
    ) {
      if (!this.gl || !colorProgram || !checkpointBuffer) return;
      const gl = this.gl;
      gl.useProgram(colorProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, checkpointBuffer);
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
  
    drawArrowTowards(
      colorProgram: WebGLProgram,
      edgeArrowBuffer: WebGLBuffer,
      x: number,
      y: number,
      color: [number, number, number, number]
    ) {
      if (!this.gl || !colorProgram || !edgeArrowBuffer) return;
      const gl = this.gl;
      gl.useProgram(colorProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, edgeArrowBuffer);
      const m = Math.max(Math.abs(x), Math.abs(y));
      if (m < 0.00001) return;
      const t = 1 / m;
      const tipX = x * t;
      const tipY = y * t;
      const arrowSize = 0.05;
      const halfBase = arrowSize / 2;
      const angle = Math.atan2(tipY, tipX);
      const baseX = tipX - arrowSize * Math.cos(angle);
      const baseY = tipY - arrowSize * Math.sin(angle);
      const leftX = baseX + halfBase * Math.sin(angle);
      const leftY = baseY - halfBase * Math.cos(angle);
      const rightX = baseX - halfBase * Math.sin(angle);
      const rightY = baseY + halfBase * Math.cos(angle);
      const arrowVerts = new Float32Array([
        tipX,
        tipY,
        leftX,
        leftY,
        rightX,
        rightY,
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, arrowVerts, gl.DYNAMIC_DRAW);
      const aPos = gl.getAttribLocation(colorProgram, "a_position");
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      const uColor = gl.getUniformLocation(colorProgram, "u_color");
      gl.uniform4f(uColor, color[0], color[1], color[2], color[3]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }
  