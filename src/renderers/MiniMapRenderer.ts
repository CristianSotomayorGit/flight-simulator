export class MiniMapRenderer {
    private gl: WebGLRenderingContext;
    private program: WebGLProgram;
    private positionBuffer: WebGLBuffer;
    private texCoordBuffer: WebGLBuffer;
    private aPosition: GLint;
    private aTexCoord: GLint;
    private uAngle: WebGLUniformLocation | null;
    private uScale: WebGLUniformLocation | null;
    private uOffset: WebGLUniformLocation | null;
    private uGrayscale: WebGLUniformLocation | null;
    private uTexture: WebGLUniformLocation | null;
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
  }
  