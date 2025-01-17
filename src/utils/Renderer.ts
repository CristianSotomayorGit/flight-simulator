export class Renderer {
  private canvas: HTMLCanvasElement;
  private gl!: WebGLRenderingContext | null;

  private mainProgram: WebGLProgram | null = null;
  private colorProgram: WebGLProgram | null = null;
  private lineProgram: WebGLProgram | null = null;

  private main_a_positionLoc!: GLint;
  private main_a_texCoordLoc!: GLint;
  private main_u_angleLoc!: WebGLUniformLocation | null;
  private main_u_scaleLoc!: WebGLUniformLocation | null;
  private main_u_offsetLoc!: WebGLUniformLocation | null;
  private main_u_textureLoc!: WebGLUniformLocation | null;
  private main_u_grayscaleLoc!: WebGLUniformLocation | null;

  private color_a_positionLoc!: GLint;
  private color_u_colorLoc!: WebGLUniformLocation | null;

  private line_a_positionLoc!: GLint;
  private line_a_colorLoc!: GLint;

  private positionBuffer!: WebGLBuffer | null;
  private texCoordBuffer!: WebGLBuffer | null;
  private planePosBuffer!: WebGLBuffer | null;
  private planeTexBuffer!: WebGLBuffer | null;
  private crossBuffer!: WebGLBuffer | null;
  private checkpointBuffer!: WebGLBuffer | null;
  private edgeArrowBuffer!: WebGLBuffer | null;
  private lineBuffer!: WebGLBuffer | null;
  private lineColorBuffer!: WebGLBuffer | null;

  private mapTexture!: WebGLTexture | null;
  private planeTexture!: WebGLTexture | null;

  public angle = 2.23;
  public scale = 0.009;
  public offsetX = 0.229;
  public offsetY = 0.31117;
  public rotateStep = 0.005;
  public moveSpeed = 0.0;

  private takeOffCounter = 0;

  private positions = new Float32Array([
    -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
  ]);
  private texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);
  private planePositions = new Float32Array([
    -0.1, -0.1, 0.1, -0.1, -0.1, 0.1, -0.1, 0.1, 0.1, -0.1, 0.1, 0.1,
  ]);
  private planeTexCoords = new Float32Array([
    0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1,
  ]);

  private checkpoints: Array<[number, number]> = [
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

  private checkpointsMiniMap = [
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

  private currCheckpoint: [number, number] | null = null;
  private pathPoints: Array<{ u: number; v: number; speed: number }> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.currCheckpoint = this.checkpoints.pop() ?? null;
  }

  public async initialize() {
    await this.initializeWebGl();
    this.startRendering();
  }

  public updateState({ angle, scale, moveSpeed }: { angle?: number; scale?: number; moveSpeed?: number }) {
    if (angle !== undefined) this.angle = angle;
    if (scale !== undefined) this.scale = scale;
    if (moveSpeed !== undefined) this.moveSpeed = moveSpeed;
  }

  public dispose() {}

  private async initializeWebGl() {
    this.gl = this.canvas.getContext("webgl", { alpha: true });
    if (!this.gl) {
      alert("WebGL not supported");
      return;
    }
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    const mainVertSrc = `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        uniform float u_angle;
        uniform float u_scale;
        uniform vec2  u_offset;
        varying vec2 v_texCoord;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          vec2 centered = a_texCoord - vec2(0.5, 0.5);
          float c = cos(u_angle);
          float s = sin(u_angle);
          vec2 rotated = vec2(
            c * centered.x - s * centered.y,
            s * centered.x + c * centered.y
          );
          rotated *= u_scale;
          v_texCoord = rotated + vec2(0.5, 0.5) + u_offset;
        }
      `;
    const mainFragSrc = `
        precision mediump float;
        varying vec2 v_texCoord;
        uniform sampler2D u_texture;
        uniform bool u_grayscale;
        void main() {
          vec4 col = texture2D(u_texture, v_texCoord);
          if (u_grayscale) {
            float gray = dot(col.rgb, vec3(0.299, 0.587, 0.114));
            gl_FragColor = vec4(gray, gray, gray, col.a);
          } else {
            gl_FragColor = col;
          }
        }
      `;
    const colorVertSrc = `
        attribute vec2 a_position;
        uniform vec4 u_color;
        varying vec4 v_color;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_color = u_color;
        }
      `;
    const colorFragSrc = `
        precision mediump float;
        varying vec4 v_color;
        void main() {
          gl_FragColor = v_color;
        }
      `;
    const lineVertSrc = `
      attribute vec2 a_position;
      attribute vec4 a_color;
      varying vec4 v_color;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_color = a_color;
      }
    `;
    const lineFragSrc = `
      precision mediump float;
      varying vec4 v_color;
      void main() {
        gl_FragColor = v_color;
      }
    `;

    this.mainProgram = this.createProgram(this.gl, mainVertSrc, mainFragSrc);
    this.colorProgram = this.createProgram(this.gl, colorVertSrc, colorFragSrc);
    this.lineProgram = this.createProgram(this.gl, lineVertSrc, lineFragSrc);

    this.gl.useProgram(this.mainProgram);
    this.main_a_positionLoc = this.gl.getAttribLocation(
      this.mainProgram!,
      "a_position"
    );
    this.main_a_texCoordLoc = this.gl.getAttribLocation(
      this.mainProgram!,
      "a_texCoord"
    );
    this.main_u_angleLoc = this.gl.getUniformLocation(
      this.mainProgram!,
      "u_angle"
    );
    this.main_u_scaleLoc = this.gl.getUniformLocation(
      this.mainProgram!,
      "u_scale"
    );
    this.main_u_offsetLoc = this.gl.getUniformLocation(
      this.mainProgram!,
      "u_offset"
    );
    this.main_u_textureLoc = this.gl.getUniformLocation(
      this.mainProgram!,
      "u_texture"
    );
    this.main_u_grayscaleLoc = this.gl.getUniformLocation(
      this.mainProgram!,
      "u_grayscale"
    );

    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.positions,
      this.gl.STATIC_DRAW
    );

    this.texCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.texCoords,
      this.gl.STATIC_DRAW
    );

    this.planePosBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.planePosBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.planePositions,
      this.gl.STATIC_DRAW
    );

    this.planeTexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.planeTexBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.planeTexCoords,
      this.gl.STATIC_DRAW
    );

    this.color_a_positionLoc = this.gl.getAttribLocation(
      this.colorProgram!,
      "a_position"
    );
    this.color_u_colorLoc = this.gl.getUniformLocation(
      this.colorProgram!,
      "u_color"
    );

    this.crossBuffer = this.gl.createBuffer();
    this.checkpointBuffer = this.gl.createBuffer();
    this.edgeArrowBuffer = this.gl.createBuffer();

    this.mapTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.mapTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      1,
      1,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      new Uint8Array([255, 0, 255, 255])
    );
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

    this.planeTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.planeTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      1,
      1,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      new Uint8Array([0, 255, 255, 255])
    );

    this.gl.useProgram(this.lineProgram);
    this.line_a_positionLoc = this.gl.getAttribLocation(this.lineProgram!, "a_position");
    this.line_a_colorLoc = this.gl.getAttribLocation(this.lineProgram!, "a_color");
    this.lineBuffer = this.gl.createBuffer();
    this.lineColorBuffer = this.gl.createBuffer();

    await this.loadTextures();
  }

  private startRendering() {
    const renderLoop = () => {
      this.render();
      requestAnimationFrame(renderLoop);
    };
    requestAnimationFrame(renderLoop);
  }

  private render() {
    if (!this.gl) return;

    const worldX = 0.5 + this.offsetX;
    const worldY = 0.5 + this.offsetY;
    this.pathPoints.push({ u: worldX, v: worldY, speed: this.moveSpeed });

    if (this.takeOffCounter < 2000) {
      this.moveSpeed += 0.0001 / 2000;
      this.takeOffCounter += 1;

      if (this.takeOffCounter > 800 && this.scale < 0.15) {
        this.scale += 0.15 / 1200;
      }
      if (this.takeOffCounter > 1000) {
        this.angle -= 1.3 / 1000;
      }
    }

    this.offsetX -= Math.sin(this.angle) * this.moveSpeed;
    this.offsetY += Math.cos(this.angle) * this.moveSpeed;

    this.drawMapView();
    this.drawPath();
    this.drawPlane();

    if (this.currCheckpoint) {
      if (
        Math.abs(this.currCheckpoint[0] - (0.5 + this.offsetX)) < 0.01 &&
        Math.abs(this.currCheckpoint[1] - (0.5 + this.offsetY)) < 0.01
      ) {
        this.currCheckpoint = this.checkpoints.pop() ?? null;
      }
      this.drawCheckpointOrArrow();
    }

    this.drawMiniMapView();
    this.drawMiniMapPlane();
    this.drawMiniMapCheckpoints();
  }

  private computeClipSpace(u: number, v: number) {
    const v00 = this.computeCornerTexcoord([0, 0]);
    const v10 = this.computeCornerTexcoord([1, 0]);
    const v01 = this.computeCornerTexcoord([0, 1]);

    const A = (v10[0] - v00[0]) / 2;
    const B = (v01[0] - v00[0]) / 2;
    const C = v00[0] + A + B;
    const D = (v10[1] - v00[1]) / 2;
    const E = (v01[1] - v00[1]) / 2;
    const F = v00[1] + D + E;
    const Delta = A * E - B * D;

    const sx = (E * (u - C) - B * (v - F)) / Delta;
    const sy = (-D * (u - C) + A * (v - F)) / Delta;
    return { sx, sy };
  }

  private computeCornerTexcoord(tc: [number, number]) {
    const centeredX = tc[0] - 0.5;
    const centeredY = tc[1] - 0.5;
    const c = Math.cos(this.angle);
    const s = Math.sin(this.angle);
    let rotX = c * centeredX - s * centeredY;
    let rotY = s * centeredX + c * centeredY;
    rotX *= this.scale;
    rotY *= this.scale;
    return [rotX + 0.5 + this.offsetX, rotY + 0.5 + this.offsetY];
  }

  private drawMapView() {
    if (!this.gl || !this.mainProgram) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = this.canvas.clientWidth;
    const displayHeight = this.canvas.clientHeight;

    this.canvas.width = displayWidth * dpr;
    this.canvas.height = displayHeight * dpr;

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(0.15, 0.15, 0.15, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.gl.useProgram(this.mainProgram);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.enableVertexAttribArray(this.main_a_positionLoc);
    this.gl.vertexAttribPointer(
      this.main_a_positionLoc,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
    this.gl.enableVertexAttribArray(this.main_a_texCoordLoc);
    this.gl.vertexAttribPointer(
      this.main_a_texCoordLoc,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    this.gl.uniform1f(this.main_u_angleLoc, this.angle);
    this.gl.uniform1f(this.main_u_scaleLoc, this.scale);
    this.gl.uniform2f(this.main_u_offsetLoc, this.offsetX, this.offsetY);
    this.gl.uniform1i(this.main_u_grayscaleLoc, 0);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.mapTexture);
    this.gl.uniform1i(this.main_u_textureLoc, 0);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  private drawPlane() {
    if (!this.gl || !this.mainProgram) return;

    this.gl.useProgram(this.mainProgram);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.planePosBuffer);
    this.gl.enableVertexAttribArray(this.main_a_positionLoc);
    this.gl.vertexAttribPointer(
      this.main_a_positionLoc,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.planeTexBuffer);
    this.gl.enableVertexAttribArray(this.main_a_texCoordLoc);
    this.gl.vertexAttribPointer(
      this.main_a_texCoordLoc,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    this.gl.uniform1f(this.main_u_angleLoc, 0.0);
    this.gl.uniform1f(this.main_u_scaleLoc, 1.0);
    this.gl.uniform2f(this.main_u_offsetLoc, 0.0, 0.0);
    this.gl.uniform1i(this.main_u_grayscaleLoc, 0);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.planeTexture);
    this.gl.uniform1i(this.main_u_textureLoc, 0);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  private drawCheckpointOrArrow() {
    if (!this.gl || !this.colorProgram || !this.currCheckpoint) return;
    const { sx, sy } = this.computeClipSpace(
      this.currCheckpoint[0],
      this.currCheckpoint[1]
    );
    if (sx >= -1 && sx <= 1 && sy >= -1 && sy <= 1) {
      this.drawSquare(sx, sy, 0.04, [0, 1, 0, 1]);
    } else {
      this.drawArrowTowards(sx, sy, [0.0, 1.0, 1.0, 1.0]);
    }
  }

  private drawMiniMapView() {
    if (!this.gl || !this.mainProgram) return;

    const miniWidth = 250;
    const miniHeight = 250;
    this.gl.viewport(0, 0, miniWidth, miniHeight);

    this.gl.useProgram(this.mainProgram);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.enableVertexAttribArray(this.main_a_positionLoc);
    this.gl.vertexAttribPointer(
      this.main_a_positionLoc,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
    this.gl.enableVertexAttribArray(this.main_a_texCoordLoc);
    this.gl.vertexAttribPointer(
      this.main_a_texCoordLoc,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    this.gl.uniform1f(this.main_u_angleLoc, 0.0);
    this.gl.uniform1f(this.main_u_scaleLoc, 1.0);
    this.gl.uniform2f(this.main_u_offsetLoc, 0.0, 0.0);
    this.gl.uniform1i(this.main_u_grayscaleLoc, 1);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.mapTexture);
    this.gl.uniform1i(this.main_u_textureLoc, 0);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  private drawMiniMapPlane() {
    if (!this.gl || !this.colorProgram) return;
    const gl = this.gl;

    const mainCenterX = 2.0 * (0.5 + this.offsetX) - 1.0;
    const mainCenterY = 2.0 * (0.5 + this.offsetY) - 1.0;
    const miniTriSize = 0.05;
    const miniLocalCoords = [
      0,
      miniTriSize,
      -miniTriSize,
      -miniTriSize,
      miniTriSize,
      -miniTriSize,
    ];

    const rotateAndTranslateMini = (
      x: number,
      y: number,
      angle: number,
      cx: number,
      cy: number
    ) => {
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const rx = x * cosA - y * sinA;
      const ry = x * sinA + y * cosA;
      return [rx + cx, ry + cy];
    };

    const miniTriVerts: number[] = [];
    for (let i = 0; i < miniLocalCoords.length; i += 2) {
      const [rx, ry] = rotateAndTranslateMini(
        miniLocalCoords[i],
        miniLocalCoords[i + 1],
        this.angle,
        mainCenterX,
        mainCenterY
      );
      miniTriVerts.push(rx, ry);
    }
    const miniTriArray = new Float32Array(miniTriVerts);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.crossBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, miniTriArray, gl.DYNAMIC_DRAW);
    gl.useProgram(this.colorProgram);

    gl.enableVertexAttribArray(this.color_a_positionLoc);
    gl.vertexAttribPointer(this.color_a_positionLoc, 2, gl.FLOAT, false, 0, 0);

    gl.uniform4f(this.color_u_colorLoc, 1.0, 0.5, 0.0, 1.0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private drawMiniMapCheckpoints() {
    if (!this.gl || !this.colorProgram) return;
    this.checkpointsMiniMap.forEach((cp) => {
      const { sx, sy } = this.computeClipSpaceMinimap(cp[0], cp[1]);
      this.drawSquare(sx, sy, 0.04, [0, 1, 0, 1]);
    });
  }

  private drawSquare(
    cx: number,
    cy: number,
    size: number,
    color: [number, number, number, number]
  ) {
    if (!this.gl || !this.colorProgram || !this.checkpointBuffer) return;
    const gl = this.gl;

    gl.useProgram(this.colorProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.checkpointBuffer);

    const half = size / 2;
    const verts = new Float32Array([
      cx - half,
      cy - half,
      cx + half,
      cy - half,
      cx - half,
      cy + half,
      cx - half,
      cy + half,
      cx + half,
      cy - half,
      cx + half,
      cy + half,
    ]);

    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.color_a_positionLoc);
    gl.vertexAttribPointer(this.color_a_positionLoc, 2, gl.FLOAT, false, 0, 0);

    gl.uniform4f(this.color_u_colorLoc, color[0], color[1], color[2], color[3]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private drawArrowTowards(
    cx: number,
    cy: number,
    color: [number, number, number, number]
  ) {
    if (!this.gl || !this.colorProgram || !this.edgeArrowBuffer) return;
    const gl = this.gl;

    gl.useProgram(this.colorProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.edgeArrowBuffer);

    const m = Math.max(Math.abs(cx), Math.abs(cy));
    if (m < 0.00001) return;
    const t = 1.0 / m;
    const tipX = cx * t;
    const tipY = cy * t;

    const arrowSize = 0.05;
    const halfBase = arrowSize / 2;

    const angle = Math.atan2(tipY, tipX);
    const baseX = tipX - arrowSize * Math.cos(angle);
    const baseY = tipY - arrowSize * Math.sin(angle);

    const leftX = baseX + halfBase * Math.sin(angle);
    const leftY = baseY - halfBase * Math.cos(angle);
    const rightX = baseX - halfBase * Math.sin(angle);
    const rightY = baseY + halfBase * Math.cos(angle);

    const arrowVertices = new Float32Array([
      tipX,
      tipY,
      leftX,
      leftY,
      rightX,
      rightY,
    ]);

    gl.bufferData(gl.ARRAY_BUFFER, arrowVertices, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.color_a_positionLoc);
    gl.vertexAttribPointer(this.color_a_positionLoc, 2, gl.FLOAT, false, 0, 0);

    gl.uniform4f(this.color_u_colorLoc, color[0], color[1], color[2], color[3]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private computeClipSpaceMinimap(u: number, v: number) {
    const sx = 2 * u - 1;
    const sy = 2 * v - 1;
    return { sx, sy };
  }

  private createProgram(
    gl: WebGLRenderingContext,
    vertSrc: string,
    fragSrc: string
  ) {
    const vs = this.compileShader(gl, gl.VERTEX_SHADER, vertSrc);
    const fs = this.compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return null;
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  private compileShader(gl: WebGLRenderingContext, type: number, src: string) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private loadTextures(): Promise<void> {
    return new Promise((resolve) => {
      let imagesLoaded = 0;

      const mapImage = new Image();
      mapImage.src = "map.jpg";
      mapImage.onload = () => {
        if (this.gl && this.mapTexture) {
          this.gl.bindTexture(this.gl.TEXTURE_2D, this.mapTexture);
          this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            mapImage
          );
          this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_WRAP_S,
            this.gl.CLAMP_TO_EDGE
          );
          this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_WRAP_T,
            this.gl.CLAMP_TO_EDGE
          );
          this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_MIN_FILTER,
            this.gl.LINEAR
          );
          this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_MAG_FILTER,
            this.gl.LINEAR
          );
        }
        imagesLoaded++;
        if (imagesLoaded === 2) resolve();
      };

      const planeImage = new Image();
      planeImage.src = "plane2.png";
      planeImage.onload = () => {
        if (this.gl && this.planeTexture) {
          this.gl.bindTexture(this.gl.TEXTURE_2D, this.planeTexture);
          this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            planeImage
          );
          this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_WRAP_S,
            this.gl.CLAMP_TO_EDGE
          );
          this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_WRAP_T,
            this.gl.CLAMP_TO_EDGE
          );
          this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_MIN_FILTER,
            this.gl.LINEAR
          );
          this.gl.texParameteri(
            this.gl.TEXTURE_2D,
            this.gl.TEXTURE_MAG_FILTER,
            this.gl.LINEAR
          );
        }
        imagesLoaded++;
        if (imagesLoaded === 2) resolve();
      };
    });
  }

  private getSpeedColor(speed: number): [number, number, number, number] {
    const stops = [0, 0.0003, 0.0009, 0.0012];
    const colors = [
      [0, 0, 1],
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0]
    ];
    if (speed <= stops[0]) return [colors[0][0], colors[0][1], colors[0][2], 1];
    for (let i = 1; i < stops.length; i++) {
      if (speed <= stops[i]) {
        const t = (speed - stops[i - 1]) / (stops[i] - stops[i - 1]);
        const col = [
          colors[i - 1][0] * (1 - t) + colors[i][0] * t,
          colors[i - 1][1] * (1 - t) + colors[i][1] * t,
          colors[i - 1][2] * (1 - t) + colors[i][2] * t
        ];
        return [col[0], col[1], col[2], 1];
      }
    }
    const last = colors[colors.length - 1];
    return [last[0], last[1], last[2], 1];
  }
  

  private drawPath() {
    if (!this.gl || !this.lineProgram) return;
  
    const gl = this.gl;
    const len = this.pathPoints.length;
    if (len < 2) return;
  
    const posArray = new Float32Array(len * 2);
    const colArray = new Float32Array(len * 4);
  
    for (let i = 0; i < len; i++) {
      const pt = this.pathPoints[i];
      const { sx, sy } = this.computeClipSpace(pt.u, pt.v);
      posArray[i * 2] = sx;
      posArray[i * 2 + 1] = sy;
  
      const color = this.getSpeedColor(pt.speed);
      colArray[i * 4 + 0] = color[0];
      colArray[i * 4 + 1] = color[1];
      colArray[i * 4 + 2] = color[2];
      colArray[i * 4 + 3] = color[3];
    }
  
    gl.useProgram(this.lineProgram);
    gl.lineWidth(5);
  
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, posArray, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.line_a_positionLoc);
    gl.vertexAttribPointer(this.line_a_positionLoc, 2, gl.FLOAT, false, 0, 0);
  
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colArray, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.line_a_colorLoc);
    gl.vertexAttribPointer(this.line_a_colorLoc, 4, gl.FLOAT, false, 0, 0);
  
    gl.drawArrays(gl.LINE_STRIP, 0, len);
  }
}
