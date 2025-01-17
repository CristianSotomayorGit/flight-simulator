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
  }
  