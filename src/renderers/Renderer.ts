import { initializeWebGL, createShaderPrograms } from "./WebGLInitializer";
import { loadTextures } from "./ResourceLoader";
import { MapRenderer } from "./MapRenderer";
import { PlaneRenderer } from "./PlaneRenderer";
import { PathRenderer } from "./PathRenderer";
import { MiniMapRenderer } from "./MiniMapRenderer";

export class Renderer {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext | null = null;
  paused: boolean = false;
  mainProgram: WebGLProgram | null = null;
  colorProgram: WebGLProgram | null = null;
  lineProgram: WebGLProgram | null = null;
  mapRenderer: MapRenderer | null = null;
  planeRenderer: PlaneRenderer | null = null;
  pathRenderer: PathRenderer | null = null;
  miniMapRenderer: MiniMapRenderer | null = null;
  angle = 2.23;
  scale = 0.009;
  offsetX = 0.229;
  offsetY = 0.31117;
  rotateStep = 0.005;
  moveSpeed = 0;
  takingOff = false;
  takeOffCounter = 0;
  positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
  texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);
  planePositions = new Float32Array([
    -0.1, -0.1, 0.1, -0.1, -0.1, 0.1, -0.1, 0.1, 0.1, -0.1, 0.1, 0.1,
  ]);
  planeTexCoords = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);
  checkpoints: Array<[number, number]> = [
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

  currCheckpoint: [number, number] | null = null;
  pathPoints: Array<{ u: number; v: number; speed: number }> = [];
  positionBuffer: WebGLBuffer | null = null;
  texCoordBuffer: WebGLBuffer | null = null;
  planePosBuffer: WebGLBuffer | null = null;
  planeTexBuffer: WebGLBuffer | null = null;
  crossBuffer: WebGLBuffer | null = null;
  checkpointBuffer: WebGLBuffer | null = null;
  edgeArrowBuffer: WebGLBuffer | null = null;
  lineBuffer: WebGLBuffer | null = null;
  lineColorBuffer: WebGLBuffer | null = null;
  mapTexture: WebGLTexture | null = null;
  planeTexture: WebGLTexture | null = null;
  private onUpdate:
    | ((state: {
        angle: number;
        scale: number;
        moveSpeed: number;
        takingOff: boolean;
      }) => void)
    | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.currCheckpoint = this.checkpoints.pop() ?? null;
  }

  async initialize(
    mainVertSrc: string,
    mainFragSrc: string,
    colorVertSrc: string,
    colorFragSrc: string,
    lineVertSrc: string,
    lineFragSrc: string,
    mapUrl: string,
    planeUrl: string
  ) {
    this.gl = initializeWebGL(this.canvas);
    if (!this.gl) return;
    const programs = createShaderPrograms(
      this.gl,
      mainVertSrc,
      mainFragSrc,
      colorVertSrc,
      colorFragSrc,
      lineVertSrc,
      lineFragSrc
    );
    this.mainProgram = programs.mainProgram;
    this.colorProgram = programs.colorProgram;
    this.lineProgram = programs.lineProgram;
    if (!this.mainProgram || !this.colorProgram || !this.lineProgram) return;
    this.positionBuffer = this.gl.createBuffer();
    if (!this.positionBuffer) return;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.positions,
      this.gl.STATIC_DRAW
    );
    this.texCoordBuffer = this.gl.createBuffer();
    if (!this.texCoordBuffer) return;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.texCoords,
      this.gl.STATIC_DRAW
    );
    this.planePosBuffer = this.gl.createBuffer();
    if (!this.planePosBuffer) return;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.planePosBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.planePositions,
      this.gl.STATIC_DRAW
    );
    this.planeTexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.planeTexBuffer);
    if (!this.planeTexBuffer) return;
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      this.planeTexCoords,
      this.gl.STATIC_DRAW
    );
    this.crossBuffer = this.gl.createBuffer();
    this.checkpointBuffer = this.gl.createBuffer();
    if (!this.checkpointBuffer) return;
    this.edgeArrowBuffer = this.gl.createBuffer();
    this.lineBuffer = this.gl.createBuffer();
    if (!this.lineBuffer) return;
    this.lineColorBuffer = this.gl.createBuffer();
    if (!this.lineColorBuffer) return;
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
    this.mapTexture = this.gl.createTexture();
    this.planeTexture = this.gl.createTexture();
    await loadTextures(
      this.gl,
      this.mapTexture,
      this.planeTexture,
      mapUrl,
      planeUrl
    );

    this.mapRenderer = new MapRenderer(
      this.gl,
      this.mainProgram,
      this.positionBuffer,
      this.texCoordBuffer,
      this.mapTexture
    );
    this.planeRenderer = new PlaneRenderer(
      this.gl,
      this.mainProgram,
      this.planePosBuffer,
      this.planeTexBuffer,
      this.planeTexture
    );
    this.pathRenderer = new PathRenderer(
      this.gl,
      this.lineProgram,
      this.lineBuffer,
      this.lineColorBuffer
    );
    this.miniMapRenderer = new MiniMapRenderer(
      this.gl,
      this.mainProgram,
      this.positionBuffer,
      this.texCoordBuffer,
      this.checkpointBuffer,
      this.mapTexture
    );
    this.startRendering();
  }

  startRendering() {
    const renderLoop = () => {
      if (!this.paused) {
        this.render();
      }
      requestAnimationFrame(renderLoop);
    };
    requestAnimationFrame(renderLoop);
  }

  private notifyUpdate() {
    if (this.onUpdate) {
      this.onUpdate({
        angle: this.angle,
        scale: this.scale,
        moveSpeed: this.moveSpeed,
        takingOff: this.takingOff,
      });
    }
  }

  updateState({
    angle,
    scale,
    moveSpeed,
    takingOff,
  }: {
    angle?: number;
    scale?: number;
    moveSpeed?: number;
    takingOff?: boolean;
  }) {
    if (angle !== undefined) this.angle = angle;
    if (scale !== undefined) this.scale = scale;
    if (moveSpeed !== undefined) this.moveSpeed = moveSpeed;
    if (takingOff !== undefined) this.takingOff = takingOff;
  }

  computeClipSpace(u: number, v: number) {
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

  computeCornerTexcoord(tc: [number, number]) {
    const cx = tc[0] - 0.5;
    const cy = tc[1] - 0.5;
    const c = Math.cos(this.angle);
    const s = Math.sin(this.angle);
    let rx = c * cx - s * cy;
    let ry = s * cx + c * cy;
    rx *= this.scale;
    ry *= this.scale;
    return [rx + 0.5 + this.offsetX, ry + 0.5 + this.offsetY];
  }

  getSpeedColor(speed: number): [number, number, number, number] {
    const stops = [0, 0.0003, 0.0009, 0.0012];
    const colors = [
      [0, 0, 1],
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0],
    ];
    if (speed <= stops[0]) return [colors[0][0], colors[0][1], colors[0][2], 1];
    for (let i = 1; i < stops.length; i++) {
      if (speed <= stops[i]) {
        const t = (speed - stops[i - 1]) / (stops[i] - stops[i - 1]);
        const col = [
          colors[i - 1][0] * (1 - t) + colors[i][0] * t,
          colors[i - 1][1] * (1 - t) + colors[i][1] * t,
          colors[i - 1][2] * (1 - t) + colors[i][2] * t,
        ];
        return [col[0], col[1], col[2], 1];
      }
    }
    const last = colors[colors.length - 1];
    return [last[0], last[1], last[2], 1];
  }

  private animateLanding() {
    const [targetX, targetY] = [0.501, 0.3025];
    const targetAngle = (3 * Math.PI) / 2;
    this.offsetX += (targetX - (0.5 + this.offsetX)) * 0.02;
    this.offsetY += (targetY - (0.5 + this.offsetY)) * 0.02;
    this.scale = Math.max(this.scale - 0.0005, 0.009);
    const angleDiff = this.getAngleCorrection(this.angle, targetAngle);
    this.angle += angleDiff * 0.02;
    if (this.scale <= 0.009) {
      this.paused = true;
      this.moveSpeed = 0;
    }
  }

  private getAngleCorrection(
    currentAngle: number,
    targetAngle: number
  ): number {
    let delta = targetAngle - currentAngle;
    const twoPi = 2 * Math.PI;
    delta = ((delta % twoPi) + twoPi) % twoPi;
    if (delta > Math.PI) {
      delta -= twoPi;
    } else if (delta <= -Math.PI) {
      delta += twoPi;
    }
    return delta;
  }

  public setUpdateCallback(
    callback: (state: {
      angle: number;
      scale: number;
      moveSpeed: number;
      takingOff: boolean;
    }) => void
  ) {
    this.onUpdate = callback;
  }

  render() {
    if (!this.gl) return;
    const x = 0.5 + this.offsetX;
    const y = 0.5 + this.offsetY;

    this.pathPoints.push({ u: x, v: y, speed: this.moveSpeed });
    if (this.takeOffCounter < 2000) {
      this.takingOff = true;
      this.moveSpeed += 0.0001 / 2000;
      this.takeOffCounter++;
      if (this.takeOffCounter > 800 && this.scale < 0.15) {
        this.scale += 0.15 / 1200;
      }
      if (this.takeOffCounter > 1000) {
        this.angle -= 1.3 / 1000;
      }
    } else {
      this.takingOff = false;
    }

    if (this.checkpoints.length === 0) {
      this.animateLanding();
    } else {
      this.offsetX -= Math.sin(this.angle) * this.moveSpeed;
      this.offsetY += Math.cos(this.angle) * this.moveSpeed;
    }

    if (this.offsetX < -0.494 || this.offsetX > 0.494) {
      this.offsetX = Math.max(-0.494, Math.min(0.494, this.offsetX));
    }

    if (this.offsetY < -0.494 || this.offsetY > 0.494) {
      this.offsetY = Math.max(-0.494, Math.min(0.494, this.offsetY));
    }

    if (this.mapRenderer) {
      const dpr = window.devicePixelRatio || 1;
      const w = this.canvas.clientWidth;
      const h = this.canvas.clientHeight;
      this.canvas.width = w * dpr;
      this.canvas.height = h * dpr;
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.gl.clearColor(0.15, 0.15, 0.15, 1);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.mapRenderer.draw(
        this.angle,
        this.scale,
        this.offsetX,
        this.offsetY,
        false
      );
    }

    if (this.pathRenderer) {
      const data = [];
      const col = [];
      for (let i = 0; i < this.pathPoints.length; i++) {
        const p = this.computeClipSpace(
          this.pathPoints[i].u,
          this.pathPoints[i].v
        );
        data.push({ x: p.sx, y: p.sy });
        const c = this.getSpeedColor(this.pathPoints[i].speed);
        col.push(c);
      }
      this.pathRenderer.draw(data, col);
    }

    if (this.planeRenderer) {
      this.planeRenderer.draw();
    }

    if (this.currCheckpoint) {
      const cp = this.computeClipSpace(
        this.currCheckpoint[0],
        this.currCheckpoint[1]
      );
      if (
        Math.abs(this.currCheckpoint[0] - (0.5 + this.offsetX)) < 0.01 &&
        Math.abs(this.currCheckpoint[1] - (0.5 + this.offsetY)) < 0.01
      ) {
        this.currCheckpoint = this.checkpoints.pop() ?? null;
      }
      if (this.currCheckpoint) {
        if (
          !this.mapRenderer ||
          !this.colorProgram ||
          !this.checkpointBuffer ||
          !this.edgeArrowBuffer
        )
          return;
        if (cp.sx >= -1 && cp.sx <= 1 && cp.sy >= -1 && cp.sy <= 1) {
          this.mapRenderer.drawSquare(
            this.colorProgram,
            this.checkpointBuffer,
            cp.sx,
            cp.sy,
            0.04,
            [0, 1, 0, 1]
          );
        } else {
          this.mapRenderer.drawArrowTowards(
            this.colorProgram,
            this.edgeArrowBuffer,
            cp.sx,
            cp.sy,
            [0, 1, 1, 1]
          );
        }
      }
    }

    if (this.miniMapRenderer) {
      if (!this.colorProgram) return;
      if (!this.crossBuffer) return;
      this.miniMapRenderer.draw(250, 250);
      this.miniMapRenderer.drawMiniMapPlane(
        this.colorProgram,
        this.crossBuffer,
        this.offsetX,
        this.offsetY,
        this.angle
      );
      this.miniMapRenderer.drawMiniMapCheckpoints(this.colorProgram);
    }
    this.notifyUpdate();
  }
}
