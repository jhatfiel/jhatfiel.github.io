import { useEffect, useRef, useState } from 'react';
import './App.css'
import MazeViewer, { type MazeViewerHandle } from './MazeViewer';
import { Maze, type Direction } from './Maze';
import type { Algorithm } from './MazeGeneratorWorker';

function App() {
  const [algorithm, setAlgorithm] = useState<Algorithm>(() => localStorage.getItem(`generationAlgorithm`) as Algorithm??'RecursiveBacktracking');
  const [width, setWidth] = useState(() => parseInt(localStorage.getItem('mazeWidth')??'') || 40);
  const [height, setHeight] = useState(() => parseInt(localStorage.getItem('mazeHeight')??'') || 20);
  const [delay, setDelay] = useState(() => localStorage.getItem('delay') ? parseInt(localStorage.getItem('delay')!) : 0);
  const [isPlaying, setIsPlaying] = useState(false);
  useEffect(() => {
    localStorage.setItem('mazeWidth', width.toString());
    localStorage.setItem('mazeHeight', height.toString());
    localStorage.setItem('generationAlgorithm', algorithm);
    localStorage.setItem('delay', delay.toString());
  }, [width, height, algorithm, delay]);

  const mazeViewerRef = useRef<MazeViewerHandle>(null);
  const mazeRef = useRef<Maze>(new Maze(width, height));
  const workerRef = useRef<Worker>(null);

  const handlePlayPause = () => {
    if (!isPlaying) {
      if (!workerRef.current) {
        // initialize the worker
        mazeViewerRef.current?.drawMaze();
        workerRef.current = new Worker(new URL('./MazeGeneratorWorker.ts', import.meta.url), { type: 'module' });

        // handle messages from the worker
        workerRef.current.onmessage = ({data: {method, x, y, dir}}: {data: {method: string, x: number, y: number, dir: Direction}}) => {
          switch (method) {
            case 'removeWall':
              mazeViewerRef.current?.eraseWall(x, y, dir);
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
      console.log(`Worker stopped`);
    }
  };

  useEffect(() => {
    // Reset state when algorithm or width/height changes
    setIsPlaying(false);
    mazeViewerRef.current?.drawMaze();
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
            max={500} 
            value={delay} 
            onChange={e => setDelay(parseInt(e.target.value))}
            style={{width: '8rem', marginLeft: '0.5rem'}}
          />
          {delay}ms
        </label>
        <button onClick={handlePlayPause}>
          {isPlaying ? '⏸️' : '▶️'}
        </button>
      </div>
      <div style={{padding: '0.5rem', display: 'flex', gap: '1rem'}}>
        <div style={{flex: '1', minHeight: 0}}>
          <MazeViewer 
            ref={mazeViewerRef}
            width={width}
            height={height}
          />
        </div>
        <div style={{flex: '0 0 200px'}}>
          <span>Drawing Instructions</span>
        </div>
      </div>
    </div>
  );
}

export default App;