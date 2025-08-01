import type { Direction, Maze } from "../Maze";

abstract class MazeGenerator {
  constructor(public maze: Maze) {};
  abstract getNextWallToRemove(): {x: number, y: number, dir: Direction} | null;
}

export default MazeGenerator;