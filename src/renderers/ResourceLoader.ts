export async function loadTextures(
    gl: WebGLRenderingContext,
    mapTexture: WebGLTexture | null,
    planeTexture: WebGLTexture | null,
    mapUrl: string,
    planeUrl: string
  ): Promise<void> {
    if (!gl || !mapTexture || !planeTexture) return;
    await new Promise<void>((resolve) => {
      let imagesLoaded = 0;
      const mapImage = new Image();
      mapImage.src = mapUrl;
      mapImage.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, mapTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mapImage);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        imagesLoaded++;
        if (imagesLoaded === 2) resolve();
      };
      const planeImage = new Image();
      planeImage.src = planeUrl;
      planeImage.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, planeTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, planeImage);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        imagesLoaded++;
        if (imagesLoaded === 2) resolve();
      };
    });
  }
  