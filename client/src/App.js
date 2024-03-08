import './styles/App.css';
import { Routes, Route } from 'react-router-dom';
import Navbar from './component/Navbar';
import axios from 'axios';
import WishlistView from './component/Wishlists/WishlistView';
import HomeView from './component/HomeView';
import EventPopup from './component/Popups/EventPopup';
import LoadingPopup from './component/Popups/LoadingPopup';
import Game from './component/Game/Game';
import AddGameToWishlistPopup from './component/Popups/AddGameToWishlistPopup';
import { useEffect } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { deleteWishlists, setWishlists } from "./actions/wishlistAction";
import { deleteUser, isUser } from "./actions/userAction";
import { setEvent, setLoading } from "./actions/eventAction";
import SearchForGamePopup from './component/Popups/SearchForGamePopup';

function App() {
  // axios.defaults.baseURL = 'http://localhost:3001';
  axios.defaults.withCredentials = true;

  const event = useSelector(state => state.eventReducer.event);
  const isLoading = useSelector(state => state.eventReducer.loading);
  const addingGame = useSelector(state => state.eventReducer.addingGame);
  const searchPopup = useSelector(state => state.eventReducer.searchPopup);

  const dispatch = useDispatch();
  const user = useSelector(state => state.userReducer.user);
  const wishlistItems = useSelector(state => state.wishlistReducer.wishlists);

  useEffect(() => {
    if (isUser(user) && (!wishlistItems || (Object.keys(wishlistItems).length === 0))) {
      console.log("fetching wishlists")
      dispatch(setLoading(true));
      fetch('/api/wishlists', { mode: 'cors', credentials: 'include' })
        .then(function (response) {
          if (response.status === 200) {
            return response.json();
          } else if (response.status === 401) {
            // if we got 401 that means they somehow got logged out
            dispatch(deleteUser());
            dispatch(setEvent(false, response.statusText));
          } else if (response.status === 429) {
            // if we got 429 that means they are being rate limited
            dispatch(setEvent(false, response.statusText));
          }
        }).then(function (data) {
          if (data) {
            dispatch(setWishlists(data));
          }
          dispatch(setLoading(false));
        })
    } else if (!isUser(user) && wishlistItems && Object.keys(wishlistItems).length > 0) {
      console.log("deleting wishlists")
      dispatch(deleteWishlists())
    }
  }, [wishlistItems, user, dispatch]);

  return (
    <div className="App">
      <header>
        <Navbar />
      </header>
      <EventPopup trigger={event} />
      <LoadingPopup trigger={isLoading} />
      <AddGameToWishlistPopup trigger={addingGame} />
      <SearchForGamePopup trigger={!!searchPopup} />
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/wishlists/*" element={<WishlistView />} />
        <Route path="/game/:id" element={<Game />} />
        {/* <Route path ="/login" element={<Login />} /> */}
      </Routes>
    </div>
  );
}

export default App;
