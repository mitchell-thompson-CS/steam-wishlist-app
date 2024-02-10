import './App.css';
import Wishlist from './component/wishlist';
// import Login from './component/Navbar';
import { Provider } from 'react-redux';
import store from './store';
import { Routes, Route } from 'react-router-dom';
import Navbar from './component/Navbar';

function App() {
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
