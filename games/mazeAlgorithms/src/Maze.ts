class Maze {
  cells: Cell[][];

  constructor(public width: number, public height: number) {
    this.cells = Array.from({length: height}, () =>
      Array.from({length: width}, () => ({
        walls: { N: true, E: true, S: true, W: true },
        wallCount: 4,
        highlighted: false
      }))
    );
  }

  removeWall(x: number, y: number, dir: Direction) {
    const cell = this.cells[y][x];
    if (cell.walls[dir]) {
      cell.walls[dir] = false;
      cell.wallCount--;
      const dm = dirMapping[dir];
      const ox = x + dm.xd;
      const oy = y + dm.yd;
      if (oy >= 0 && oy < this.height && ox >= 0 && ox < this.width) {
        this.cells[oy][ox].walls[dm.oDir] = false;
        this.cells[oy][ox].wallCount--;
      }
    }
  }
};

interface Cell {
  walls: {N: boolean, E: boolean, S: boolean, W: boolean};
  wallCount: number;
  highlighted: boolean;
};

type Direction = 'N'|'E'|'S'|'W';
const DirectionArray: Direction[] = ['N','E','S','W'];
type DirectionDetails = {dir: Direction, xd: number, yd: number, oDir: Direction}
const dirArray: DirectionDetails[] = [
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

interface Pair {
  x: number;
  y: number;
}

export type { Direction, DirectionDetails, Pair };
export { Maze, dirMapping, dirArray, DirectionArray };