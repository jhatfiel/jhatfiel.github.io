import { Fragment, useEffect, useState } from "react";
import { type Pair, type Segment } from "./Maze";

function Distance(p1: Pair, p2: Pair): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

const maxSegments = 14;

function SegmentDrawingPlanner({segments}: {segments: Segment[]}) {
  const [optimal, setOptimal] = useState<Segment[]|undefined>(undefined);
  const [waste, setWaste] = useState(0);
  const [maxX, setMaxX] = useState(0);
  
  useEffect(() => {
    if (segments.length > 0 && segments.length <= maxSegments) {
      // we want to end in the bottom right, so calculate max x and add {p1: {maxX,0}, p2: {maxX=1,0}} to the segment array
      const maxX = Math.max(...segments.flatMap(seg => ([seg.p1.x, seg.p2.x])));
      setMaxX(maxX);

      // the score is just the distance from the last drawn segment to the next segment
      // we are ignoring the time to draw the segment and the time to lift and drop the pen
      const score = (pos: Pair, order?: Segment[]): number => {
        let time = 0;
        if (!order) return -1;
        for (const seg of order) {
          time += Distance(seg.p1, pos);
          pos = seg.p2;
        }
        time += Distance(pos, {x: maxX, y: 0}); // always end at the far right point
        return time;
      }

      console.log(`Score of default ordering: ${score({x: 0, y: 0}, segments)}`);

      const memo = new Map<string, Segment[]|undefined>();

      // try all possible arrangments of drawing the segments
      // score each arrangement by the amount of time wasted not drawing segments
      // and return the one(s) with the least time
      // this is a brute force solution for testing
      const findOptimalDrawingOrder = (pos: Pair = {x: 0, y: 0}, drawn: boolean[] = Array(segments.length).fill(false), remainingScore = Infinity): Segment[]|undefined => {
        if (remainingScore < 0) return undefined;
        const key = `${pos.x},${pos.y},${drawn}`;
        if (memo.has(key)) return memo.get(key);

        // order the segments by distance from last drawn segment
        //console.log(`${''.padStart(drawn.filter(v=>v).length, '.')}Current position: (${pos.x}, ${pos.y}) drawn=${drawn}`);
        const undrawn = segments.map((seg, index)=>({seg, index})).filter(seg => !drawn[seg.index])
                      .map(seg => ({seg, distance: Math.min(Distance(seg.seg.p1, pos), Distance(seg.seg.p2, pos))}))
                      .sort((a, b) => a.distance - b.distance)
                      .map(({seg}) => seg);
        if (undrawn.length === 0) return []; // no segments left to draw

        let bestScore = Infinity;
        let bestOrder: Segment[]|undefined = undefined;
        for (let i=0; i<undrawn.length; i++) {
          const {seg, index} = undrawn[i];
          // consider both orientations of the segment
          const newDrawn = [...drawn]; newDrawn[index] = true; // mark this segment as drawn
          const dp1 = Distance(pos, seg.p1);
          const dp2 = Distance(pos, seg.p2);
          if (dp1 > remainingScore && dp2 > remainingScore) break; // we aren't close enough to either end to make it

          // find the best way to draw the remaining segments
          let newOrder = findOptimalDrawingOrder(seg.p2, newDrawn, bestScore-dp1);
          if (newOrder) {
            const newScore = dp1 + score(seg.p2, newOrder);

            if (newScore < bestScore) {
              bestScore = newScore;
              bestOrder = [seg, ...newOrder];
            }
          }

          newOrder = findOptimalDrawingOrder(seg.p1, newDrawn, bestScore-dp2);
          if (newOrder) {
            const newScore = dp2 + score(seg.p1, newOrder);

            if (newScore < bestScore || (newScore === bestScore && dp2 === 0)) { // we would prefer to have continuous lines
              bestScore = newScore;
              bestOrder = [{p1: seg.p2, p2: seg.p1}, ...newOrder];
            }
          }
        }

        //console.log(`${''.padStart(drawn.filter(v=>v).length, '.')}Best order of remainin segments: ${bestOrder.map(seg => `(${seg.p1.x}, ${seg.p1.y}) to (${seg.p2.x}, ${seg.p2.y})`).join(', ')}`);
        memo.set(key, bestOrder);
        return bestOrder;
      }

      const now = performance.now();
      const arr = findOptimalDrawingOrder();
      console.log(`Optimal drawing order found in ${performance.now() - now}ms`);
      console.log(`Optimal drawing order(s): ${arr?.map(seg => `(${seg.p1.x}, ${seg.p1.y}) to (${seg.p2.x}, ${seg.p2.y})`).join(' / ')}`);
      const optimalScore = score({x: 0, y: 0}, arr);
      console.log(`Score of optimal ordering: ${score({x: 0, y: 0}, arr)}`);
      setWaste(optimalScore);
      setOptimal(arr);
    } else {
      setOptimal(undefined);
    }
  }, [segments]);

  
  if (segments.length === 0) {
    return <span>No segments to display</span>;
  } else if (!optimal) {
    return (<>
    <span>No solution yet (anything over {maxSegments} segments will take too long to process)</span>;
      {
        segments.map((seg, index) => (
          <div key={index}>
            <span>
              Segment {index + 1}: ({seg.p1.x}, {seg.p1.y}) to ({seg.p2.x}, {seg.p2.y})
            </span> 
          </div>
        ))
      }
    </>);
  } else {
    return (<>
      <span>Drawing Instructions</span><br/>
      Least waste: {waste}<br/>
      {
        optimal?.map((seg, index, arr) => {
          const nextPos = index===arr.length-1?{x:maxX, y:0}:arr[index+1].p1;
          const move = Math.hypot(nextPos.x-seg.p2.x, nextPos.y-seg.p2.y);
          return (
            <Fragment key={index}>
              {(index === 0 && (seg.p1.x !== 0 || seg.p1.y !== 0)) && (
              <div style={{textAlign: 'left'}}>
                Wasted movement to first location: {Math.hypot(seg.p1.x, seg.p1.y).toFixed(4)}
              </div>
              )}
              <div style={{textAlign: 'left'}}>
                <span>
                  Segment {index}: ({seg.p1.x}, {seg.p1.y}) to ({seg.p2.x}, {seg.p2.y})
                </span> 
              </div>
              {move > 0 && 
                (
                  <div style={{textAlign: 'left'}}>
                    Wasted movement to next location: {move.toFixed(4)}
                  </div>
                )
              }
            </Fragment>
          );
        })
      }
    </>);
  }
}

export default SegmentDrawingPlanner;