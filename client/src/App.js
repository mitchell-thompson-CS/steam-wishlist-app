import './App.css';
import Wishlist from './component/wishlist';
import Login from './component/Login';
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
            <Route path ="/login" element={<Login />} />
          </Routes>
        </header>
      </div>
    </Provider>
  );
}

export default App;
