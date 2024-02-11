import './App.css';
import Wishlist from './component/wishlist';
// import Login from './component/Navbar';
import { Provider } from 'react-redux';
import store from './store';
import { Routes, Route } from 'react-router-dom';
import Navbar from './component/Navbar';
import axios from 'axios';

function App() {
  // axios.defaults.baseURL = 'http://localhost:3001';
  axios.defaults.withCredentials = true;

  return (
    <Provider store={store}>
      <div className="App">
        <header className="App-header">
          <Navbar />
        </header>

        <Routes>
            <Route path="/wishlists" element={<Wishlist />} />
            {/* <Route path ="/login" element={<Login />} /> */}
          </Routes>
      </div>
    </Provider>
  );
}

export default App;
