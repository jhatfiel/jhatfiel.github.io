import Maze, { DirectionArray, type Direction, type Pair } from "../Maze";

type NextWall = {
  x: number;
  y: number;
  dir: Direction;
}

abstract class MazeGenerator {
  public startTime = Date.now();
  public count = 0;
  COLORS = {
    empty: 'rgb(0, 0, 0)',
    start: 'rgb(150, 255, 150)',
    partial: 'rgb(150, 150, 255)',
    current: 'rgb(50, 50, 255)',
    end: 'rgb(255, 150, 150)',
    finished: 'rgb(255, 255, 255)',
  }

  constructor(public maze: Maze) {};

  abstract performNextStep(): boolean;
  randomize<T>(arr: T[]): T[] {
    return Array.from(arr, (_, index)=>({index, rank: Math.random()}))
                .sort((a,b)=>a.rank-b.rank)
                .map(({index})=>arr[index]);
  }

  randomizeDirections(): Direction[] {
    return this.randomize(DirectionArray);
  }

  randomizeValidDirections(pos: Pair): Direction[] {
    const arr: Direction[] = [];
    if (pos.x > 0) arr.push('W');
    if (pos.x < this.maze.width-1) arr.push('E');
    if (pos.y > 0) arr.push('N');
    if (pos.y < this.maze.height-1) arr.push('S');
    return this.randomize(arr);
  }

  removeWall(x: number, y: number, dir: Direction) {
    this.count++;
    self.postMessage({method: 'removeWall', x, y, dir});
    this.maze.removeWall(x, y, dir);
  }

  colorCell(x: number, y: number, color: string) {
    self.postMessage({method: 'colorCell', x, y, color: color});
  }
}

export {type NextWall};
export default MazeGenerator;