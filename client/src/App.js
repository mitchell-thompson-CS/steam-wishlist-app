import './styles/App.css';
// import Login from './component/Navbar';
import { useSelector } from 'react-redux';
import { Routes, Route } from 'react-router-dom';
import Navbar from './component/Navbar';
import axios from 'axios';
import { CookiesProvider } from 'react-cookie';
import WishlistView from './component/WishlistView';
import EventPopup from './component/EventPopup';
import LoadingPopup from './component/LoadingPopup';

function App() {
  // axios.defaults.baseURL = 'http://localhost:3001';
  axios.defaults.withCredentials = true;

  const event = useSelector(state => state.eventReducer.event);
  const isLoading = useSelector(state => state.eventReducer.loading);

  return (
      <div className="App">
        <header>
          <Navbar />
        </header>
        <EventPopup trigger={event}/>
        <LoadingPopup trigger={isLoading}/>
        <Routes>
          <Route path="/wishlists/*" element={<WishlistView />} />
          {/* <Route path ="/login" element={<Login />} /> */}
        </Routes>
      </div>
  );
}

export default App;
