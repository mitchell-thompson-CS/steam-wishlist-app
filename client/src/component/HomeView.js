import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import '../styles/HomeView.css';
import { Link } from "react-router-dom";
import { setEvent, setLoading } from "../actions/eventAction";

const HomeView = () => {
    const wishlistItems = useSelector(state => state.wishlistReducer.wishlists);
    const [gettingGameData, setGettingGameData] = useState(false);
    const dispatch = useDispatch();

    // useEffect(() => {
    //     async function fetchFeaturedGames() {
    //         if (!gettingGameData) {
    //             setGettingGameData(true);
    //         try {
    //             dispatch(setLoading(true));
    //             await fetch('/api/home/featured',{ mode: 'cors', credentials: 'include' })
    //                 .then(function (response) {
    //                     if (response.status === 200) {
    //                         return response.json();
    //                     }
    //                 }).then(function (data) {
    //                     if (data) {
    //                         // dispatch(addGame(key, data));
    //                     }
    //                 })
    //         } catch (error) {
    //             console.error(error);
    //         }
    //         setGettingGameData(false);
    //         dispatch(setLoading(false));
    //     }
    // }

    //     fetchFeaturedGames();
    // }, [dispatch, gettingGameData]);

    return (
        <div className="homeView">
            <div id="homeWishlistHeader">
                <div className="homeHeaderLeft">
                    <h1>YOUR WISHLISTS</h1>
                </div>
            </div>
            <div className="wishlistRow">
                {wishlistItems.owned && Object.entries(wishlistItems.owned).map(([key, value]) => (
                    <div key={key} className="rowItemContainer" title={value.name} >
                        <Link className="rowItem" to={"/wishlists/" + key}>
                            <h2>{value.name}</h2>
                            <p>
                                {value.games ? Object.keys(value.games).length : 0}
                                {value.games && Object.keys(value.games).length === 1 ? " Game" : " Games"}
                            </p>
                        </Link>
                    </div>
                ))}
                {wishlistItems.shared && Object.entries(wishlistItems.shared).map(([key, value]) => (
                    <div key={key} className="rowItemContainer" title={value.name}>
                        <Link className="rowItem" to={"/wishlists/" + key}>
                            <h2>{value.name}</h2>
                            <p>
                                {value.games ? Object.keys(value.games).length : 0}
                                {value.games && Object.keys(value.games).length === 1 ? " Game" : " Games"}
                            </p>
                        </Link>
                    </div>
                ))}
            </div>
            <div id="homePopularHeader">
                <div className="homeHeaderLeft">
                    <h1>TRENDING GAMES</h1>
                </div>
            </div>
        </div>
    )
}

export default HomeView;