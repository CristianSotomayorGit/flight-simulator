export class PathRenderer {
    private gl: WebGLRenderingContext;
    private program: WebGLProgram;
    private lineBuffer: WebGLBuffer;
    private colorBuffer: WebGLBuffer;
    private aPosition: GLint;
    private aColor: GLint;
  
    constructor(gl: WebGLRenderingContext, program: WebGLProgram, lineBuffer: WebGLBuffer, colorBuffer: WebGLBuffer) {
      this.gl = gl;
      this.program = program;
      this.lineBuffer = lineBuffer;
      this.colorBuffer = colorBuffer;
      this.aPosition = gl.getAttribLocation(program, "a_position");
      this.aColor = gl.getAttribLocation(program, "a_color");
    }
  
    draw(points: Array<{ x: number; y: number }>, colors: Array<[number, number, number, number]>) {
      if (points.length < 2) return;
      const gl = this.gl;
      const len = points.length;
      const posArray = new Float32Array(len * 2);
      const colArray = new Float32Array(len * 4);
      for (let i = 0; i < len; i++) {
        posArray[i * 2] = points[i].x;
        posArray[i * 2 + 1] = points[i].y;
        colArray[i * 4] = colors[i][0];
        colArray[i * 4 + 1] = colors[i][1];
        colArray[i * 4 + 2] = colors[i][2];
        colArray[i * 4 + 3] = colors[i][3];
      }
      gl.useProgram(this.program);
      gl.lineWidth(5);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, posArray, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(this.aPosition);
      gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, colArray, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(this.aColor);
      gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.LINE_STRIP, 0, len);
    }
  }
  