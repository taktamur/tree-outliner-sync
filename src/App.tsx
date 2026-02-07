import OutlinerPanel from './components/OutlinerPanel/OutlinerPanel';
import TreePanel from './components/TreePanel/TreePanel';
import './App.css';

function App() {
  return (
    <div className="app">
      <div className="panel-left">
        <OutlinerPanel />
      </div>
      <div className="panel-divider" />
      <div className="panel-right">
        <TreePanel />
      </div>
    </div>
  );
}

export default App;
