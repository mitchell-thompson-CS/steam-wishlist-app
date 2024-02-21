import './App.css';
import Wishlist from './component/wishlist';
import WishlistInner from './component/wishlistInner';
// import Login from './component/Navbar';
import { Provider } from 'react-redux';
import store from './store';
import { Routes, Route } from 'react-router-dom';
import Navbar from './component/Navbar';
import axios from 'axios';
import { CookiesProvider } from 'react-cookie';

function App() {
  // axios.defaults.baseURL = 'http://localhost:3001';
  axios.defaults.withCredentials = true;

  return (
    <Provider store={store}>
      <CookiesProvider defaultSetOptions={{ path: '/' }} >
        <div className="App">
          <header>
            <Navbar />
          </header>
          <Routes>
            <Route path="/wishlists" element={<Wishlist />} />
            <Route path="/wishlist/:id" element={<WishlistInner />} />
            {/* <Route path ="/login" element={<Login />} /> */}
          </Routes>
        </div>
      </CookiesProvider>
    </Provider>
  );
}

export default App;
