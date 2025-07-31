import { useEffect, useRef } from 'react';

type Direction = 'N'|'E'|'S'|'W';
const dirArray: {dir: Direction, xd: number, yd: number, oDir: Direction}[] = [
  {dir: 'N', xd:  0, yd: -1, oDir: 'S'},
  {dir: 'E', xd:  1, yd:  0, oDir: 'W'},
  {dir: 'S', xd:  0, yd:  1, oDir: 'N'},
  {dir: 'W', xd: -1, yd:  0, oDir: 'E'},
];

const dirMapping = {
  N: dirArray[0],
  E: dirArray[1],
  S: dirArray[2],
  W: dirArray[3],
};

interface Maze {
  cells: Cell[][];
}

interface Cell {
  walls: {N: boolean, E: boolean, S: boolean, W: boolean};
  wallCount: number;
  highlighted: boolean;
}

const cellSize = 16;
const WIDTH=40;
const HEIGHT=20;
const startTime = Date.now();
let initialized = false;
let count = 0;

const MAZE: Maze = {cells: Array.from({length: HEIGHT+2}, ()=>Array.from({length: WIDTH+2}, ()=>({walls: {N:true,E:true,S:true,W:true}, wallCount: 4, highlighted: false})))};

function MazeViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function drawCell(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const px = x*cellSize+1;
    const py = y*cellSize+1;
    ctx.fillRect(px, py, cellSize-2, cellSize-2);
  }

  function eraseWall(ctx: CanvasRenderingContext2D, x: number, y: number, dir: Direction) {
    const dm = dirMapping[dir];
    const x1 = (x + (dir === 'E'?1:0)) * cellSize + (dm.xd===0?-1:1);
    const y1 = (y + (dir === 'S'?1:0)) * cellSize + (dm.yd===0?-1:1);
    const x2 = (x + (dir === 'E'?1:0)) * cellSize + (dm.yd === 0?cellSize:0) + (dm.xd===0?1:-1);
    const y2 = (y + (dir === 'S'?1:0)) * cellSize + (dm.xd === 0?cellSize:0) + (dm.yd===0?1:-1);
    //console.log(`Erasing wall at (${x},${y}) in direction ${dir} from (${x1},${y1}) to (${x2},${y2})`);
    ctx.fillRect(x1, y1, x2-x1, y2-y1);
  }

  // random wall remover to test animation
  // this isn't supposed to generate a legit maze, it's just removing walls up to a limit
  useEffect(()=>{
    if (initialized) return; // only run once
    initialized = true;
    console.log(`Starting random wall remover`);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = 'white';
    ctx.fillStyle='white';

    for (let y=1; y<=HEIGHT; y++) {
      for (let x=1; x<=WIDTH; x++) {
        drawCell(ctx, x-1, y-1);
      }
    }

    setTimeout(function randomWallRemover() {
      const now = Date.now();
      let tries = 0;

      let x=Math.floor(Math.random()*WIDTH)+1;
      let y=Math.floor(Math.random()*HEIGHT)+1;
      let dirIndex = Math.floor(Math.random()*4);
      let cell = MAZE.cells[y][x]
      let dir = dirArray[dirIndex];
      while ((cell.walls[dir.dir] === false // pick a new cell/wall if the selected wall is already gone
        //|| (['N','E','S','W'] as Direction[]).filter(d=>cell.walls[d] === false).length>=2 // or the selected cell has already lost too many walls
        || cell.wallCount < 3 // or the selected cell has already lost too many walls
        || y+dir.yd==0 || x+dir.xd==0 || y+dir.yd>HEIGHT || x+dir.xd>WIDTH
        //|| (['N','E','S','W'] as Direction[]).filter(d=>MAZE.cells[y+dir.yd][x+dir.xd].walls[d] === false).length>=2 // or the adjacent cell has already lost too many walls
        || MAZE.cells[y+dir.yd][x+dir.xd].wallCount < 3 // or the selected cell has already lost too many walls
        ) && tries < 100) { // but don't try more than 100 times
        x=Math.floor(Math.random()*WIDTH)+1;
        y=Math.floor(Math.random()*HEIGHT)+1;
        cell = MAZE.cells[y][x]
        dirIndex = Math.floor(Math.random()*4);
        dir = dirArray[dirIndex];
        tries++;
      }

      if (tries >= 100) {
        console.log(`Giving up on finding walls to remove - total time: ${Date.now()-startTime}ms for ${count} walls removed`);
        return;
      }

      MAZE.cells[y][x].walls[dir.dir] = false;
      MAZE.cells[y][x].wallCount--;

      MAZE.cells[y+dir.yd][x+dir.xd].walls[dir.oDir] = false;
      MAZE.cells[y+dir.yd][x+dir.xd].wallCount--;

      eraseWall(ctx, x-1, y-1, dir.dir);

      count++;
      console.log(`[${count.toString().padStart(4,' ')}] (${Date.now()-now}ms) Removing wall at (${x-1},${y-1}) in direction ${dir.dir} / tries=${tries} / walls=${JSON.stringify(cell.walls)}`);
      setTimeout(randomWallRemover); // use requestAnimationFrame for smoother animation
      //requestAnimationFrame(randomWallRemover); // use requestAnimationFrame for smoother animation
    })
  }, []);

  return <div style={{width: '100%', height: '100%'}}>
      <canvas ref={canvasRef} width={(WIDTH+2)*cellSize} height={(HEIGHT+2)*cellSize} style={{display: 'block'}}/>
    </div>
      //<canvas ref={canvasRef} width={width} height={height} style={{display: 'block'}}/>
}

export default MazeViewer;