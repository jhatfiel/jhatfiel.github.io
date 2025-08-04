import { DirectionArray, type Direction, type Maze } from "../Maze";

type NextWall = {
  x: number;
  y: number;
  dir: Direction;
}

abstract class MazeGenerator {
  constructor(public maze: Maze) {};
  abstract getNextWallToRemove(): NextWall | undefined;
  pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random()*arr.length)];
  }
  randomize<T>(arr: T[]): T[] {
    const sorter = Array.from(arr, (_, index)=>({index, rank: Math.random()}));
    sorter.sort((a,b)=>a.rank-b.rank);
    return sorter.map(({index})=>arr[index]);
  }
  randomizeDirections(): Direction[] {
    return this.randomize(DirectionArray);
  }
}

export {type NextWall};
export default MazeGenerator;