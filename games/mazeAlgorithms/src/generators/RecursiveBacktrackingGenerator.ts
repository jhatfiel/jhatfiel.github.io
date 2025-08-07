import { dirMapping, Maze, pick, type DirectionDetails, type Pair } from "../Maze";
import MazeGenerator, { type NextWall } from "./MazeGenerator";

class RecursiveBacktrackingGenerator extends MazeGenerator {
  startTime = Date.now();
  count = 0;
  parent: {pair: Pair, depth: number}[][];
  currentPos: Pair = { x: 0, y: -1 };
  complete = false;

  constructor(maze: Maze) {
    super(maze);
    this.parent = Array.from({ length: maze.height }, () =>
      Array.from({ length: maze.width }, () => ({pair: { x: -1, y: -1 }, depth: -1}))
    );
  }

  getNextWallToRemove(): NextWall | undefined {
    if (this.complete) return undefined;

    let selected: NextWall|undefined = undefined;

    if (this.currentPos.y === -1) {
      // get the start cell
      selected = {x: 0, y: Math.floor(Math.random()*this.maze.height), dir: 'W'};
      this.currentPos.y = selected.y;
      this.parent[selected.y][selected.x].depth = 0;
    } else {
      let foundChoice = false;

      do {
        const cell = this.maze.cells[this.currentPos.y][this.currentPos.x];
        const depth = this.parent[this.currentPos.y][this.currentPos.x].depth+1;
        let dir: DirectionDetails|undefined = undefined;

        // loop through directions randomly
        for (const d of this.randomizeDirections()) {
          //  skip directions where already don't have a wall (this would be caught below but it's a little faster this way)
          if (!cell.walls[d]) continue; //{console.log(`No wall from ${this.currentPos.x},${this.currentPos.y} to the ${d}`); continue};
          dir = dirMapping[d];

          const x = this.currentPos.x + dir.xd;
          const y = this.currentPos.y + dir.yd;

          // skip directions that take us outside the maze
          if (x < 0 || y < 0 || x >= this.maze.width || y >= this.maze.height) continue; //{console.log(`Step from ${this.currentPos.x},${this.currentPos.y} to the ${d} would go outside maze`); continue};
          // skip directions that take us to previously visited nodes
          if (this.parent[y][x].depth !== -1) continue; //{console.log(`Step from ${this.currentPos.x},${this.currentPos.y} to the ${d} would go to visited node`); continue};

          //console.log(`We can move to ${x},${y}`);
          this.count++;
          selected = {...this.currentPos, dir: d};

          //  remove the wall in this direction and set our new position
          this.parent[y][x] = {pair: this.currentPos, depth};
          this.currentPos = {x, y};
          foundChoice = true;
          break;
        }

        if (!foundChoice) {
          // if we don't have any choices, backtrack to our parent (if we are back at the beginning then we're done)
          const parent = this.parent[this.currentPos.y][this.currentPos.x];
          const x = this.maze.width-1;

          this.currentPos = {...parent.pair};
          if (this.currentPos.y === -1) {
            // we are back at the start, we're done - get an escape in the far right column
            let best: number[] = [];
            let bestDepth = 0;

            for (let y=0; y<this.maze.height; y++) {
              const d = this.parent[y][x].depth;

              if (d > bestDepth) {
                best = [];
                bestDepth = d;
              }

              if (d === bestDepth) {
                best.push(y);
              }
            }
            const y = pick(best);

            selected = {x, y, dir: 'E'};
            console.log(`RecursiveBacktracking complete - total time: ${Date.now()-this.startTime}ms for ${this.count} walls removed`);
            this.complete = true;
            foundChoice = true;
          }
        }
      } while (!foundChoice);
    }

    if (selected) this.maze.removeWall(selected.x, selected.y, selected.dir);
    return selected;
  }

}

export default RecursiveBacktrackingGenerator;