import { useCallback, useEffect, useRef } from 'react';
import { dirMapping, type Direction} from './Maze';

const buffer = 10;
const cellSize = 16;

interface MazeViewerProps {
  width: number;
  height: number;
  callback: (
    reset: () => void,
    removeWall: (x: number, y: number, dir: Direction) => void,
  ) => void;
}

function MazeViewer({width, height, callback}: MazeViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D>(null);

  function drawCell(x: number, y: number) {
    const px = buffer + x*cellSize+1;
    const py = buffer + y*cellSize+1;
    ctxRef.current?.fillRect(px, py, cellSize-2, cellSize-2);
  }

  function eraseWall(x: number, y: number, dir: Direction) {
    const dm = dirMapping[dir];
    // const x1 = buffer + (x + (dir === 'E'?1:0)) * cellSize + (dm.xd === 0?-1:1);
    // const y1 = buffer + (y + (dir === 'S'?1:0)) * cellSize + (dm.yd === 0?-1:1);
    // const x2 = buffer + (x + (dir === 'S'?1:0)) * cellSize + (dm.yd === 0?cellSize:0) + (dm.xd === 0?1:-1);
    // const y2 = buffer + (y + (dir === 'E'?1:0)) * cellSize + (dm.xd === 0?cellSize:0) + (dm.yd === 0?1:-1);

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
    ctxRef.current.fillRect(0, 0, 20+width*cellSize, 20+height*cellSize);
    ctxRef.current.clearRect(9, 9, width*cellSize+2, height*cellSize+2);

    for (let y=0; y<height; y++) {
      for (let x=0; x<width; x++) {
        drawCell(x, y);
      }
    }
  }, [width, height]);

  useEffect(() => {
    callback(
      () => drawMaze(),
      (x: number, y: number, dir: Direction) => eraseWall(x, y, dir),
    );
  }, [callback, drawMaze]);

  return <div style={{width: '100%', height: '100%'}}>
      <canvas ref={canvasRef} width={(width)*cellSize + 2*buffer} height={(height)*cellSize + 2*buffer} style={{display: 'block'}}/>
    </div>
      //<canvas ref={canvasRef} width={width} height={height} style={{display: 'block'}}/>
}

export default MazeViewer;