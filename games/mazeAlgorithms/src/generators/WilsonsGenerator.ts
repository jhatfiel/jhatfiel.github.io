import Maze, { dirMapping, type Direction, type Pair } from "../Maze";
import MazeGenerator from "./MazeGenerator";

class WilsonsGenerator extends MazeGenerator {
  startTime = Date.now();
  count = 0;
  complete = false;
  randomizedCells: Pair[];
  contained: boolean[] = [];
  directionForCurrentWalk: Direction[] = [];
  currentWalkTouched: Pair[] = [];
  walkPos: Pair|undefined;
  startWalkPos: Pair|undefined;
  state = 'START';

  constructor(maze: Maze) {
    super(maze);
    const arr: {pair: Pair, order: number}[] = [];
    for (let x=0; x<maze.width; x++) {
      for (let y=0; y<maze.height; y++) {
        arr.push({pair: {x,y}, order: Math.random()});
      }
    }
    arr.sort((a,b) => a.order-b.order);
    this.randomizedCells = arr.map(({pair})=>pair);
  }

  isContained(pair?: Pair): boolean { return (pair !== undefined) && this.contained[pair.y*this.maze.width + pair.x] === true; }
  setContained(pair: Pair) { this.contained[pair.y*this.maze.width + pair.x] = true; }

  setDirectionForCurrentWalk(pair: Pair, d: Direction) {
    const index = pair.y * this.maze.width + pair.x;
    if (this.directionForCurrentWalk[index] === undefined) this.currentWalkTouched.push(pair);
    this.directionForCurrentWalk[index] = d;
  }

  getDirectionForCurrentWalk(pair: Pair): Direction { return this.directionForCurrentWalk[pair.y*this.maze.width + pair.x]; }

  clearCurrentWalk() { // better to reinitialize every time or go through and set all to 0?
    this.currentWalkTouched = [];
    this.directionForCurrentWalk = [];
  }

  performNextStep(): boolean {
    switch (this.state) {
      case 'START': this.selectStartCell(); break;
      case 'STARTWALK': this.startWalk(); break;
      case 'WALK': this.walk(); break;
    }
    if (this.state === 'DONE') {
      // pick a random start and end cell
      let y = Math.floor(Math.random() * this.maze.height);
      this.removeWall(0, y, 'W');
      this.colorCell(0, y, this.COLORS.start);
      const x = this.maze.width-1;
      y = Math.floor(Math.random() * this.maze.height);
      this.removeWall(x, y, 'E');
      this.colorCell(x, y, this.COLORS.end);
      return false;
    } else {
      return true;
    }
  }

  // pick the randomized first cell to be "in" the maze
  selectStartCell() {
    const cell = this.randomizedCells.pop();
    if (!cell) { this.state = 'DONE'; return; }
    this.setContained(cell);
    this.colorCell(cell.x, cell.y, this.COLORS.finished);
    this.state = 'STARTWALK';
  }

  // find the next random cell that isn't yet contained
  startWalk() {
    let cell: Pair|undefined;
    do {
      cell = this.randomizedCells.pop();
    } while (this.isContained(cell));
    if (!cell) { this.state = 'DONE'; return; }
    this.colorCell(cell.x, cell.y, this.COLORS.current);
    this.walkPos = cell;
    this.startWalkPos = cell;
    //console.log(`Starting walk at ${cell.x},${cell.y}`);
    this.state = 'WALK';
  }

  // walk until we hit a contained cell
  walk() {
    if (!this.walkPos) { this.state = 'DONE'; return; }
    const d = this.randomizeValidDirections(this.walkPos)[0];
    const dir = dirMapping[d];
    const x = this.walkPos.x + dir.xd;
    const y = this.walkPos.y + dir.yd;
    this.setDirectionForCurrentWalk(this.walkPos, d);
    this.colorCell(this.walkPos.x, this.walkPos.y, this.COLORS.partial);

    //console.log(`Walking from ${this.walkPos.x},${this.walkPos.y} to the ${d} gets us to ${x},${y}`);

    this.walkPos = {x,y};

    if (this.isContained(this.walkPos)) {
      //console.log(`Found maze at ${x},${y}`);
      this.currentWalkTouched.forEach(pos => this.colorCell(pos.x, pos.y, this.COLORS.empty));
      const pos = {...this.startWalkPos!};
      let d = this.getDirectionForCurrentWalk(pos);
      while (d) {
        // mark all the cells as in
        this.setContained(pos);
        this.colorCell(pos.x, pos.y, this.COLORS.finished);
        // erase all the walls
        this.removeWall(pos.x, pos.y, d);
        //console.log(`Marking ${pos.x},${pos.y} as finished and removing wall to the ${d}`);

        const dir = dirMapping[d];
        pos.x += dir.xd;
        pos.y += dir.yd;
        d = this.getDirectionForCurrentWalk(pos);
      }
      // reset state to STARTWALK
      this.state = 'STARTWALK';
      this.clearCurrentWalk();
    } else {
      this.colorCell(x, y, this.COLORS.current);
    }
  }
}

export default WilsonsGenerator;