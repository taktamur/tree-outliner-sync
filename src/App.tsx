import OutlinerPanel from './components/OutlinerPanel/OutlinerPanel';
import TreePanel from './components/TreePanel/TreePanel';
import ShortcutBar from './components/ShortcutBar/ShortcutBar';
import './App.css';

function App() {
  return (
    <div className="app">
      <div className="app-main">
        <div className="panel-left">
          <OutlinerPanel />
        </div>
        <div className="panel-divider" />
        <div className="panel-right">
          <TreePanel />
        </div>
      </div>
      <ShortcutBar />
    </div>
  );
}

export default App;
