import './App.css'
import MazeViewer from './MazeViewer';

function App() {
  return (
    <div style={{height:"100%", display: 'flex', flexDirection: 'column'}}>
      <div style={{padding: '0.5rem'}}>
      Controls go here
      </div>
      <div style={{flex: '1', minHeight: 0}}>
        <MazeViewer/>
      </div>
    </div>
  );
}

export default App
