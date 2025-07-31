import { Stage, Layer, Rect, Line } from 'react-konva';
import useElementDimensions from './useElementDimensions';
import { Fragment, useEffect, useRef } from 'react';
import Konva from 'konva';
//Konva.showWarnings=true;
//Konva.pixelRatio=1;

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
  highlighted: boolean;
}

const cellSize = 4;
const WIDTH=100;
const HEIGHT=50;
const startTime = Date.now();
let initialized = false;
let count = 0;

const MAZE: Maze = {cells: Array.from({length: HEIGHT+2}, ()=>Array.from({length: WIDTH+2}, ()=>({walls: {N:true,E:true,S:true,W:true}, highlighted: false})))};

function MazeViewer() {
  const cellRefs = useRef<Map<string, Konva.Line>>(new Map());

  function hideWall(x: number, y: number, dir: Direction) {
    //cellRefs.current.set(`${x}-${y}-${x+dm.xd}-${y+dm.yd}-${dm.dir}`, node);
    const dm = dirMapping[dir];
    const key = `${x}-${y}-${x+dm.xd}-${y+dm.yd}-${dm.dir}`;
    const line = cellRefs.current.get(key);
    if (line) {
      line.visible(false);
      //line.getLayer()?.batchDraw();
    } else {
      console.log(`No line found for key ${key} at (${x},${y}) in direction ${dir}`); // log if no line found
    }
  }

  const { dimensions, ref } = useElementDimensions();
  const { height, width } = dimensions ?? {};

  // random wall remover to test animation
  // this isn't supposed to generate a legit maze, it's just removing walls up to a limit
  useEffect(()=>{
    if (initialized) return; // only run once
    initialized = true;
    console.log(`Starting random wall remover`);
    setTimeout(function randomWallRemover() {
      const now = Date.now();
      let tries = 0;

      let x=Math.floor(Math.random()*WIDTH)+1;
      let y=Math.floor(Math.random()*HEIGHT)+1;
      let dirIndex = Math.floor(Math.random()*4);
      let cell = MAZE.cells[y][x]
      let dir = dirArray[dirIndex];
      while ((cell.walls[dir.dir] === false // pick a new cell/wall if the selected wall is already gone
        || (['N','E','S','W'] as Direction[]).filter(d=>cell.walls[d] === false).length>=2 // or the selected cell has already lost too many walls
        || y+dir.yd==0 || x+dir.xd==0 || y+dir.yd>HEIGHT || x+dir.xd>WIDTH
        || (['N','E','S','W'] as Direction[]).filter(d=>MAZE.cells[y+dir.yd][x+dir.xd].walls[d] === false).length>=2 // or the adjacent cell has already lost too many walls
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

      cell = {...MAZE.cells[y][x]};
      MAZE.cells[y][x] = cell;
      cell.walls = {...cell.walls};
      cell.walls[dir.dir] = false;

      cell = {...MAZE.cells[y+dir.yd][x+dir.xd]};
      MAZE.cells[y+dir.yd][x+dir.xd] = cell;
      cell.walls = {...cell.walls};
      cell.walls[dir.oDir] = false;

      hideWall(x-1, y-1, dir.dir);
      //hideWall(x+dir.xd, y+dir.yd, dir.oDir);

      count++;
      console.log(`[${count.toString().padStart(4,' ')}] (${Date.now()-now}ms) Removing wall at (${x-1},${y-1}) in direction ${dir.dir} / tries=${tries} / walls=${JSON.stringify(cell.walls)}`);
      setTimeout(randomWallRemover); // use requestAnimationFrame for smoother animation
      //requestAnimationFrame(randomWallRemover); // use requestAnimationFrame for smoother animation
    })
  }, []);

  function Wall({x, y, dir}: {x: number, y: number, dir: Direction}) {
    const dm = dirMapping[dir];
    // {cell.walls.N && (<Line points={[x*cellSize,y*cellSize,(x+1)*cellSize,y*cellSize]} stroke='black' listening={false}/>)}
    // {cell.walls.E && (<Line points={[(x+1)*cellSize,y*cellSize,(x+1)*cellSize,(y+1)*cellSize]} stroke='black' listening={false}/>)}
    // {cell.walls.S && (<Line points={[x*cellSize,(y+1)*cellSize,(x+1)*cellSize,(y+1)*cellSize]} stroke='black' listening={false}/>)}
    // {cell.walls.W && (<Line points={[x*cellSize,y*cellSize,x*cellSize,(y+1)*cellSize]} stroke='black' listening={false}/>)}
    const x1 = (x + (dir === 'E'?1:0)) * cellSize;
    const y1 = (y + (dir === 'S'?1:0)) * cellSize;
    const x2 = x1 + (dm.xd === 0?cellSize:0);
    const y2 = y1 + (dm.yd === 0?cellSize:0);
    x--; y--;
    return (
      <Line
        ref={node=>{
          if (node) {
            cellRefs.current.set(`${x}-${y}-${x+dm.xd}-${y+dm.yd}-${dm.dir}`, node);
            cellRefs.current.set(`${x+dm.xd}-${y+dm.yd}-${x}-${y}-${dm.oDir}`, node);
          }
        }}
        points={[x1, y1, x2, y2]}
        stroke={'black'}
        listening={false}
      />
      );
  }

  // need to keep track of rectangles in a refs map as well so we can change their color
  return (
    <div ref={ref} style={{height:"100%", width:"100%"}}>
      <Stage width={width} height={height} drawBorders={true}>
        <Layer perfectDrawEnabled={false} listening={false} cacheEnabled={true}>
          <Rect x={0} y={0} width={width} height={height} fill="white"/>
        </Layer>
        <Layer perfectDrawEnabled={false} listening={false} cacheEnabled={true}>
          {MAZE.cells.map((row, y) => 
            row.map((_cell, x) => (
              <Fragment key={`${x}-${y}`}>
                {x>0 && y>0 && x<=WIDTH && y<=HEIGHT && (
                  <Rect
                    x={(x)*cellSize + 1}
                    y={(y)*cellSize + 1}
                    width={(x)*cellSize - 2}
                    height={(y)*cellSize - 2}
                    fill='white'/>
                )}

                {/* {x>0 && x<=WIDTH && y>0 && (<Wall x={x} y={y} dir='N'/>)} */}
                {x>0 && x<=WIDTH && y<=HEIGHT && (<Wall x={x} y={y} dir='S'/>)}

                {y>0 && y<=HEIGHT && x<=WIDTH && (<Wall x={x} y={y} dir='E'/>)}
                {/* {y>0 && y<=HEIGHT && x>0 && (<Wall x={x} y={y} dir='W'/>)} */}
              </Fragment>
            )))}
        </Layer>
      </Stage>
  </div>
  );
}

export default MazeViewer;