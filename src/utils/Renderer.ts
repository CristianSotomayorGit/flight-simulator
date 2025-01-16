export class Renderer {
  private canvas: HTMLCanvasElement;
  private gl!: WebGLRenderingContext;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  public async initialize() {
    await this.initializeWebGl();
    this.startRendering();
  }

  public dispose() {}

  private async initializeWebGl() {
    const context = this.canvas.getContext("webgl", { alpha: true });
    if (!context) throw Error("WebGL not supported");
    this.gl = context;
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
  }

  private startRendering() {
    const renderLoop = () => {
      this.render();
      requestAnimationFrame(renderLoop);
    };
    requestAnimationFrame(renderLoop);
  }

  private render() {
    this.gl.clearColor(0.0, 0.0, 1.0, 1.0); // Blue: (R=0, G=0, B=1, A=1)

    // Clear the color buffer
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }
}
