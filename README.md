# Airplane Control Simulation

This repository contains a basic application that simulates controlling an airplane on a 2D plane viewed from above. The airplane flies at a constant cruising altitude, and users can adjust its yaw angle (direction) and airspeed. The application dynamically updates and displays the airplane’s trajectory on a canvas as it moves.

[**Try Demo Here!**](http://CristianSotomayorGit.github.io/flight-simulator)


---

![Flight simulation](/public/flight-demo.gif)


---

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation & Running](#installation--running)
- [User Interface & Controls](#user-interface--controls)
- [Trajectory Visualization Logic](#trajectory-visualization-logic)
- [Technical Details](#technical-details)
- [License](#license)

---

## Features

- **Real-Time Airplane Control**: Adjust yaw angle and airspeed using keyboard controls.
- **Dynamic Trajectory Drawing**: As the airplane moves, its path is drawn continuously on a canvas.
- **Responsive to Changes**: The trajectory updates in real-time to reflect direction and speed changes.
- **Edge Handling**: Custom logic to handle when the airplane reaches the edges of the canvas.

---

## Requirements

1. **Airplane Controls:**
   - Users can adjust the airplane’s yaw angle (in degrees) and airspeed (in knots).
   - Controls are provided via keyboard:
     - **Left Arrow**: Turn left (increase yaw).
     - **Right Arrow**: Turn right (decrease yaw).
     - **Up Arrow**: Accelerate (increase airspeed).
     - **Down Arrow**: Decelerate (decrease airspeed).
     - **Space**: Pause/unpause simulation.

2. **Trajectory Visualization:**
   - The airplane’s trajectory is drawn on a `<canvas>` element using WebGL.
   - The path is a continuous line that updates as the airplane changes direction or speed.
   - The simulation applies custom logic at canvas edges to prevent the airplane from moving off-screen.

---

## Installation & Running

1. **Clone the repository:**
   ```bash
   git clone https://github.com/CristianSotomayorGit/flight-simulator.git
   cd flight-simulator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser to start the simulation.

4. **Build for production (optional):**
   ```bash
   npm run build
   ```
   This command creates a production-ready build in the `dist/` directory.

---

## User Interface & Controls

- **Canvas**: The main view area where the airplane and its trajectory are drawn.
- **Compass**: Displays the current yaw direction.
- **HUD**: Shows current speed, elevation, and yaw information.
- **Keyboard Controls**:
  - **Arrow Keys** adjust yaw and speed.
  - **Spacebar** pauses the simulation.
  - Additional keys (`W` / `S`) subtly adjust the map's scale (zoom level).

These controls are implemented using React hooks (`useKeys`, `useFlightControls`) which capture key events and update the airplane's state accordingly.

---

## Trajectory Visualization Logic

The trajectory visualization involves collecting the airplane’s positions over time and rendering them as a continuous path. This is primarily handled by the `PathRenderer` and the `Renderer` classes.

### Path Collection and Rendering

In the `Renderer` class, each frame:
1. The current position and speed are added to `pathPoints`.
2. These points are transformed into clip space coordinates using `computeClipSpace()`.
3. The `PathRenderer.draw()` method is called to render the path.

**Excerpt from `Renderer.render()`:**

```typescript
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
```

**Excerpt from `PathRenderer.draw()`:**

```typescript
draw(points: Array<{ x: number; y: number }>, colors: Array<[number, number, number, number]>) {
  if (points.length < 2) return;
  // Set up buffers and shaders ...
  gl.drawArrays(gl.LINE_STRIP, 0, points.length);
}
```

### Coordinate Transformation

The method `computeClipSpace(u, v)` in `Renderer.ts` converts map coordinates (`u`, `v`) into clip-space coordinates (`sx`, `sy`) for WebGL rendering. 

**Excerpt from `computeClipSpace()`:**

```typescript
computeClipSpace(u: number, v: number) {
  const v00 = this.computeCornerTexcoord([0, 0]);
  // ...compute other corners and coefficients...
  const Delta = A * E - B * D;
  const sx = (E * (u - C) - B * (v - F)) / Delta;
  const sy = (-D * (u - C) + A * (v - F)) / Delta;
  return { sx, sy };
}
```

This transformation takes into account the airplane's current `angle`, `scale`, and position offsets to accurately plot the points on the canvas.

### Handling Direction and Speed Changes

- **Yaw (Direction)**: Adjusting yaw changes the `angle`, which in turn influences the sine and cosine values used to update position:
  ```typescript
  this.offsetX -= Math.sin(this.angle) * this.moveSpeed;
  this.offsetY += Math.cos(this.angle) * this.moveSpeed;
  ```
- **Airspeed**: Changes in `moveSpeed` determine how far the airplane travels between frames, influencing how frequently new points are added to the trajectory.

### Edge Handling

The renderer clamps the airplane’s position if it reaches the edges of the canvas:

```typescript
if (this.offsetX < -0.494 || this.offsetX > 0.494) {
  this.offsetX = Math.max(-0.494, Math.min(0.494, this.offsetX));
}

if (this.offsetY < -0.494 || this.offsetY > 0.494) {
  this.offsetY = Math.max(-0.494, Math.min(0.494, this.offsetY));
}
```

This prevents the airplane from moving off-screen and ensures the trajectory stays within the visible area.

---

## Technical Details

- **WebGL Rendering**:
  - The application uses WebGL for high-performance 2D graphics.
  - Separate shader programs handle rendering for the map, plane, and path.
  - Textures for the map and airplane are loaded asynchronously and applied to geometry.

- **React Architecture**:
  - Components like `WebGLCanvas`, `Compass`, and `CenteredColumn` structure the UI.
  - Custom hooks (`useWebGL`, `useKeys`, `useFlightControls`) manage WebGL initialization, input handling, and flight dynamics.
  - The main rendering loop is managed within the `Renderer` class, which continuously updates the scene using `requestAnimationFrame`.

- **Shaders**:
  - **Map Shaders** (`map.vert.glsl`, `map.frag.glsl`): Handle drawing the map texture with rotation, scaling, and translation.
  - **Line Shaders** (`line.vert.glsl`, `line.frag.glsl`): Used by the `PathRenderer` to draw the trajectory line with varying colors based on speed.
  - **Color Shaders** (`color.vert.glsl`, `color.frag.glsl`): Used for simple colored shapes like checkpoints and indicators.

---

## License

This project is provided for educational purposes. It shall not be copied, cloned, or modified unless under the explicit authorization of the author.

---

Enjoy controlling the airplane and exploring its flight path! ✈️