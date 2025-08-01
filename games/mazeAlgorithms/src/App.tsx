import { useEffect, useRef, useState } from 'react';
import './App.css'
import MazeViewer from './MazeViewer';
import { Maze, type Direction } from './Maze';
import type { Algorithm } from './MazeGeneratorWorker';

function App() {
  const [algorithm, setAlgorithm] = useState<Algorithm>('Random');
  const [width, setWidth] = useState(40);
  const [height, setHeight] = useState(20);
  const [delay, setDelay] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const mazeRef = useRef<Maze>(new Maze(width, height));
  const workerStartedRef = useRef(false);
  const workerRef = useRef<Worker>(null);
  const removeWallRef = useRef<(x: number, y: number, dir: Direction) => void>(null);
  const resetRef = useRef<() => void>(null);

  const handlePlayPause = () => {
    if (!isPlaying) {
      if (!workerRef.current) {
        // initialize the worker
        resetRef.current?.();
        workerRef.current = new Worker(new URL('./MazeGeneratorWorker.ts', import.meta.url), { type: 'module' });

        workerRef.current.onmessage = ({data: {method, x, y, dir}}: {data: {method: string, x: number, y: number, dir: Direction}}) => {
          switch (method) {
            case 'removeWall':
              workerStartedRef.current = true;
              removeWallRef.current?.(x, y, dir);
              break;
            case 'done':
              setIsPlaying(false);
              stopWorker();
              break;
          }
        }
      }

      // Start the worker
      workerRef.current?.postMessage({method: 'play', maze: mazeRef.current, delay, algorithm});
    } else {
      if (workerRef.current) {
        workerRef.current.postMessage({method: 'stop'});
      }
    }
    setIsPlaying(!isPlaying);
  };

  const stopWorker = () => {
    if (workerRef.current) {
      workerRef.current.onmessage = null; // Clean up the message handler
      workerRef.current.terminate(); // Terminate the worker
      workerRef.current = null;
      workerStartedRef.current = false;
      console.log(`Worker stopped`);
    }
  };

  useEffect(() => {
    // Reset state when algorithm or width/height changes
    setIsPlaying(false);
    resetRef.current?.();
    // Create a new Maze object with the new dimensions
    mazeRef.current = new Maze(width, height);
    // kill the worker here as well
    stopWorker();
  }, [algorithm, width, height]);

  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({delay}); // Update the delay
    }
  }, [delay])

  return (
    <div style={{height:"100%", display: 'flex', flexDirection: 'column'}}>
      <div style={{padding: '0.5rem', display: 'flex', gap: '1rem', alignItems: 'center'}}>
        <select value={algorithm} onChange={e => setAlgorithm(e.target.value as Algorithm)}>
          <option value="Random">Random</option>
          <option value="RecursiveBacktracking">Recursive Backtracking</option>
          <option value="Wilsons">Wilson's Algorithm</option>
        </select>
        <label>
          Width:
          <input 
            type="number" 
            value={width} 
            onChange={e => setWidth(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
            style={{width: '4rem', marginLeft: '0.5rem'}}
            min={1}
            max={1000}
          />
        </label>
        <label>
          Height:
          <input 
            type="number" 
            value={height} 
            onChange={e => setHeight(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
            style={{width: '4rem', marginLeft: '0.5rem'}}
            min={1}
            max={1000}
          />
        </label>
        <label>
          Delay:
          <input 
            type="range" 
            min={0} 
            max={2000} 
            value={delay} 
            onChange={e => setDelay(parseInt(e.target.value))}
            style={{width: '8rem', marginLeft: '0.5rem'}}
          />
          {delay}ms
        </label>
        <button onClick={handlePlayPause}>
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>
      </div>
      <div style={{flex: '1', minHeight: 0}}>
        <MazeViewer 
          width={width}
          height={height}
          callback={
            (reset, removeWall) => {resetRef.current = reset; removeWallRef.current = removeWall;}
          }
        />
      </div>
    </div>
  );
}

export default App;