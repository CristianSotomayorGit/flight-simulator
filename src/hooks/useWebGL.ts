import { useEffect, useRef, useState } from "react";
import { Renderer } from "../renderers/Renderer";
import { mapFrag, mapVert, colorVert, colorFrag, lineVert, lineFrag } from "../shaders";

export const useWebGL = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const rendererRef = useRef<Renderer | null>(null);
  const [didLoad, setLoad] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    const initRenderer = async () => {
      if (!canvasRef.current) return;
      rendererRef.current = new Renderer(canvasRef.current);
      try {
        await rendererRef.current.initialize(
          mapVert,
          mapFrag,
          colorVert,
          colorFrag,
          lineVert,
          lineFrag,
          "/map.jpg",
          "/plane2.png"
        );
        setLoad(!didLoad);
      } catch (error) {
        setInitializationError(error instanceof Error ? error.message : String(error));
      }
    };
    initRenderer();
    return () => {
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, [canvasRef]);

  return { rendererRef, didLoad, initializationError };
};
