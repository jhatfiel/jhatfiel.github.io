import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css'
import MazeViewer, { type MazeViewerHandle } from './MazeViewer';
import Maze, { type Direction, type Segment } from './Maze';
import type { Algorithm } from './MazeGeneratorWorker';
import SegmentDrawingPlanner from './SegmentDrawingPlanner';

const cellSize = 16;

function App() {
  const [algorithm, setAlgorithm] = useState<Algorithm>(() => localStorage.getItem(`generationAlgorithm`) as Algorithm??'RecursiveBacktracking');
  const [width, setWidth] = useState(() => parseInt(localStorage.getItem('mazeWidth')??'') || 40);
  const [height, setHeight] = useState(() => parseInt(localStorage.getItem('mazeHeight')??'') || 20);
  const [delay, setDelay] = useState(() => localStorage.getItem('delay') ? parseInt(localStorage.getItem('delay')!) : 1);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [state, setState] = useState('');

  useEffect(() => {
    localStorage.setItem('mazeWidth', width.toString());
    localStorage.setItem('mazeHeight', height.toString());
    localStorage.setItem('generationAlgorithm', algorithm);
    localStorage.setItem('delay', delay.toString());
  }, [width, height, algorithm, delay]);

  const mazeViewerRef = useRef<MazeViewerHandle>(null);
  const mazeRef = useRef<Maze>(new Maze(width, height));
  const workerRef = useRef<Worker>(null);

  const handleFind = useCallback(() => {
    setState('GENERATING');
    setDelay(0);
    mazeRef.current = new Maze(width, height);
    // initialize the worker
    mazeViewerRef.current?.drawMaze('white');
    workerRef.current = new Worker(new URL('./MazeGeneratorWorker.ts', import.meta.url), { type: 'module' });
    // handle messages from the worker
    workerRef.current.onmessage = ({data: {method, x, y, dir, color}}: {data: {method: string, x: number, y: number, dir?: Direction, color?: string}}) => {
      switch (method) {
        case 'removeWall':
          if (!dir) throw new Error(`Direction not specified for removeWall ${x}, ${y}`);
          mazeRef.current.removeWall(x, y, dir);
          mazeViewerRef.current?.eraseWall(x, y, dir);
          break;
        case 'colorCell':
          if (!color) throw new Error(`Color not specified for colorCell ${x}, ${y}`);
          mazeViewerRef.current?.colorCell(x, y, color);
          break;
        case 'done':
          setIsPlaying(false);
          stopWorker();
          setSegments(mazeRef.current.getSegments());
          setState('FINDING');
          break;
      }
    }

    // Start the worker
    workerRef.current?.postMessage({method: 'play', maze: mazeRef.current, delay, algorithm});
  }, [algorithm, delay, height, width]);

  useEffect(() => {
    if (state === 'COMPLETE') {
      handleFind();
    } else if (state === 'FOUND') {
      setState('');
      console.log(`%c ----- FOUND! -----`, "color:red;");
    }
  }, [handleFind, state])

  const handlePlayPause = () => {
    if (!isPlaying) {
      if (!workerRef.current) {
        // Create a new Maze object with the new dimensions
        mazeRef.current = new Maze(width, height);
        // initialize the worker
        mazeViewerRef.current?.drawMaze();
        workerRef.current = new Worker(new URL('./MazeGeneratorWorker.ts', import.meta.url), { type: 'module' });

        // handle messages from the worker
        workerRef.current.onmessage = ({data: {method, x, y, dir, color}}: {data: {method: string, x: number, y: number, dir?: Direction, color?: string}}) => {
          switch (method) {
            case 'removeWall':
              if (!dir) throw new Error(`Direction not specified for removeWall ${x}, ${y}`);
              mazeRef.current.removeWall(x, y, dir);
              mazeViewerRef.current?.eraseWall(x, y, dir);
              break;
            case 'colorCell':
              if (!color) throw new Error(`Color not specified for colorCell ${x}, ${y}`);
              mazeViewerRef.current?.colorCell(x, y, color);
              break;
            case 'done':
              setIsPlaying(false);
              stopWorker();
              setSegments(mazeRef.current.getSegments());
              setState('FIND');
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
      console.log(`Worker stopped`);
    }
  };

  useEffect(() => {
    // Reset state when algorithm or width/height changes
    setIsPlaying(false);
    mazeViewerRef.current?.drawMaze();
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
            max={500} 
            value={delay} 
            onChange={e => setDelay(parseInt(e.target.value))}
            style={{width: '16rem', marginLeft: '0.5rem'}}
          />
          {delay}ms
        </label>
        <button onClick={handlePlayPause}>
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <button onClick={handleFind} disabled={state!==''} title="Run continuously until finding a maze that matches a specific characteristic (currently: optimal draw includes a non-draw first move)">
          {state==='' ? 'Find' : state}
        </button>
      </div>
      <div style={{padding: '0.5rem', display: 'flex', gap: '1rem'}}>
        <div style={{flex: '1', minHeight: 0}}>
          <MazeViewer 
            ref={mazeViewerRef}
            width={width}
            height={height}
            buffer={20}
            cellSize={cellSize}
          />
        </div>
        <div style={{flex: '0 0 400px'}}>
          <SegmentDrawingPlanner segments={segments} state={state} setState={setState}/>
        </div>
      </div>
    </div>
  );
}

export default App;