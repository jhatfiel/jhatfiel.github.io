import { dirArray, type Direction } from "../Maze";
import MazeGenerator from "./MazeGenerator";

// random wall remover to test animation
// this isn't supposed to generate a legit maze, it's just removing walls until we can't find any more
class RandomMazeGenerator extends MazeGenerator {
  startTime = Date.now();
  count = 0;

  getNextWallToRemove(): {x: number, y: number, dir: Direction} | undefined {
    const maze = this.maze;
    const width = maze.width;
    const height = maze.height;
    //const now = Date.now();
    let tries = 0;

    let x=Math.floor(Math.random()*width);
    let y=Math.floor(Math.random()*height);
    let dirIndex = Math.floor(Math.random()*4);
    let cell = maze.cells[y][x]
    let dir = dirArray[dirIndex];
    let ox = x+dir.xd;
    let oy = y+dir.yd;
    while ((cell.walls[dir.dir] === false // pick a new cell/wall if the selected wall is already gone
      || cell.wallCount < 3 // or the selected cell has already lost too many walls
      || (oy>=0 && oy<height && ox>=0 && ox<width && maze.cells[oy][ox].wallCount < 3) // or the selected cell has already lost too many walls
      ) && tries < 100) { // but don't try more than 100 times
      x=Math.floor(Math.random()*width);
      y=Math.floor(Math.random()*height);
      cell = maze.cells[y][x]
      dirIndex = Math.floor(Math.random()*4);
      dir = dirArray[dirIndex];
      ox = x+dir.xd;
      oy = y+dir.yd;
      tries++;
    }

    if (tries >= 100) {
      console.log(`Giving up on finding walls to remove - total time: ${Date.now()-this.startTime}ms for ${this.count} walls removed`);
      return undefined;
    }

    maze.removeWall(x, y, dir.dir);

    this.count++;
    //console.log(`[${this.count.toString().padStart(4,' ')}] (${Date.now()-now}ms) Removing wall at (${x},${y}) in direction ${dir.dir} / tries=${tries} / walls=${JSON.stringify(cell.walls)}`);
    return {x, y, dir: dir.dir};
  }

}

export default RandomMazeGenerator;