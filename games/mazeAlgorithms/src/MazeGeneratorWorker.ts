import type MazeGenerator from "./generators/MazeGenerator";
import RandomMazeGenerator from "./generators/RandomMazeGenerator";
import { type Direction, Maze } from "./Maze";

type Algorithm = 'Random' | 'RecursiveBacktracking' | 'Wilsons';

async function sleep(ms: number) {
  if (ms <= 0) return;
  return new Promise(resolve => setTimeout(resolve, ms));
}

let _delay = 0;
let _maze: Maze;
let state: 'playing'|'stopped' = 'stopped';
let mazeGenerator: MazeGenerator | null;

self.onmessage = function({data: {method, maze, algorithm, delay = 0}}: {data: {method: string, maze?: Maze, algorithm?: Algorithm, delay?: number}}) {
  if (delay !== undefined) _delay = delay;
  if (maze !== undefined) {
    _maze = maze;
    Object.setPrototypeOf(_maze, Maze.prototype);
  }

  if (algorithm !== undefined) {
    switch (algorithm) {
      case 'Random':
        mazeGenerator = new RandomMazeGenerator(_maze);
        break;
      default:
        mazeGenerator = null;
        console.error(`Unknown algorithm: ${algorithm}`);
        return;
    }
  }

  switch (method) {
    case 'play':
      state = 'playing';
      step();
      break;
    case 'stop':
      state = 'stopped';
      break;
  }
};

function removeNextWall(): {x: number, y: number, dir: Direction} | null {
  const result = mazeGenerator?.getNextWallToRemove();
  if (result === undefined) {
    // no more walls to remove
    state = 'stopped';
    self.postMessage({method: 'done'});
    return null;
  } else {
    // let the main thread know about the wall removal
    self.postMessage({...result, method: 'removeWall'});
    return result;
  }
}

async function step() {
  while (state === 'playing') {
    const result = removeNextWall();
    if (!result) {
      state = 'stopped';
      self.postMessage({method: 'done'})
      return;
    }

    await sleep(_delay);
  }
}

export { type Algorithm };