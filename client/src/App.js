import './App.css';
import Wishlist from './component/wishlist';
import { Provider } from 'react-redux';
import store from './store';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <header className="App-header">
          <Routes>
            <Route path="/" element={<Wishlist />} />
          </Routes>
        </header>
      </div>
    </Provider>
  );
}

export default App;
