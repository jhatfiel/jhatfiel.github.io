import { DirectionArray, type Direction, type Maze } from "../Maze";

type NextWall = {
  x: number;
  y: number;
  dir: Direction;
}

abstract class MazeGenerator {
  COLORS = {
    empty: 'rgb(0, 0, 0)',
    start: 'rgb(150, 255, 150)',
    partial: 'rgb(150, 150, 255)',
    current: 'rgb(50, 50, 255)',
    end: 'rgb(255, 150, 150)',
    finished: 'rgb(255, 255, 255)',
  }
  constructor(public maze: Maze) {};
  abstract getNextWallToRemove(): NextWall | undefined;
  randomize<T>(arr: T[]): T[] {
    const sorter = Array.from(arr, (_, index)=>({index, rank: Math.random()}));
    sorter.sort((a,b)=>a.rank-b.rank);
    return sorter.map(({index})=>arr[index]);
  }
  randomizeDirections(): Direction[] {
    return this.randomize(DirectionArray);
  }
  colorCell(x: number, y: number, color: string) {
    self.postMessage({method: 'colorCell', x, y, color: color});
  }
}

export {type NextWall};
export default MazeGenerator;