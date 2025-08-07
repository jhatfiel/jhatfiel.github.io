import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { dirMapping, type Direction} from './Maze';

interface MazeViewerProps {
  width: number;
  height: number;
  buffer: number;
  cellSize: number;
}

export type MazeViewerHandle = {
  drawMaze: () => void,
  eraseWall: (x: number, y: number, dir: Direction) => void
}

const MazeViewer = forwardRef<MazeViewerHandle, MazeViewerProps>(({width, height, buffer, cellSize}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D>(null);

  useImperativeHandle(ref, () => ({
    drawMaze: () => drawMaze(),
    eraseWall: (x, y, dir) => eraseWall(x, y, dir),
  }))

  function eraseWall(x: number, y: number, dir: Direction) {
    const dm = dirMapping[dir];
    let x1 = buffer + (x + (dir==='E'?1:0))*cellSize;
    let y1 = buffer + (y + (dir==='S'?1:0))*cellSize;
    let x2 = x1 + (dm.xd===0?cellSize:0);
    let y2 = y1 + (dm.yd===0?cellSize:0);
    if (dm.xd) { y1++; y2--; } else { y1--; y2++; }
    if (dm.yd) { x1++; x2--; } else { x1--; x2++; }
    //console.log(`Erasing wall at (${x},${y}) in direction ${dir} from (${x1},${y1}) to (${x2},${y2})`);
    ctxRef.current?.fillRect(x1, y1, x2-x1, y2-y1);
  }

  const drawMaze = useCallback(() => {
    function drawCell(x: number, y: number) {
      const px = buffer + x*cellSize+1;
      const py = buffer + y*cellSize+1;
      ctxRef.current?.fillRect(px, py, cellSize-2, cellSize-2);
    }

    // draw the initial maze
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!ctxRef.current) {
      ctxRef.current = canvas.getContext('2d');
      if (!ctxRef.current) return;
    }
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    ctxRef.current.strokeStyle = 'white';
    ctxRef.current.fillStyle = 'white';
    ctxRef.current.fillRect(0, 0, 2*buffer+width*cellSize, 2*buffer+height*cellSize);
    ctxRef.current.clearRect(buffer-1, buffer-1, width*cellSize+2, height*cellSize+2);

    for (let y=0; y<height; y++) {
      for (let x=0; x<width; x++) {
        drawCell(x, y);
      }
    }
  }, [buffer, width, cellSize, height]);

  return <div style={{width: '100%', height: '100%'}}>
      <canvas ref={canvasRef} width={(width)*cellSize + 2*buffer} height={(height)*cellSize + 2*buffer} style={{display: 'block'}}/>
    </div>
});

export default MazeViewer;