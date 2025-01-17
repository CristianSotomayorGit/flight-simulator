import { compileShader, createProgram } from "../utils/shaderUtils";

export function initializeWebGL(canvas: HTMLCanvasElement): WebGLRenderingContext | null {
  const gl = canvas.getContext("webgl", { alpha: true });
  if (!gl) return null;
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  return gl;
}

export function createShaderPrograms(
  gl: WebGLRenderingContext,
  mainVertSrc: string,
  mainFragSrc: string,
  colorVertSrc: string,
  colorFragSrc: string,
  lineVertSrc: string,
  lineFragSrc: string
) {
  const mainProgram = createProgram(gl, compileShader(gl, gl.VERTEX_SHADER, mainVertSrc), compileShader(gl, gl.FRAGMENT_SHADER, mainFragSrc));
  const colorProgram = createProgram(gl, compileShader(gl, gl.VERTEX_SHADER, colorVertSrc), compileShader(gl, gl.FRAGMENT_SHADER, colorFragSrc));
  const lineProgram = createProgram(gl, compileShader(gl, gl.VERTEX_SHADER, lineVertSrc), compileShader(gl, gl.FRAGMENT_SHADER, lineFragSrc));
  return { mainProgram, colorProgram, lineProgram };
}
