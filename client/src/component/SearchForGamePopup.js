import { useParams } from 'react-router-dom';
import '../styles/SearchForGamePopup.css';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAddGameToWishlist, setEvent, setLoading, setSearchPopup } from '../actions/eventAction';
import axios from 'axios';
import { addGameToWishlist } from '../actions/wishlistAction';

const searchDelay = 500;

const SearchForGamePopup = (props) => {

    const dispatch = useDispatch();
    const searchPopup = useSelector(state => state.eventReducer.searchPopup);
    const wishlistItems = useSelector(state => state.wishlistReducer.wishlists);
    const [searchTerm, setSearchTerm] = useState("");

    const closePopup = useCallback((e) => {
        if (e.target.className === "search-for-game-popup" 
        || e.target.id === "search-for-game-popup-blur"
        || e.key === "Escape") {
            dispatch(setSearchPopup(false));
            document.removeEventListener('click', closePopup);
            document.removeEventListener('keydown', closePopup);
        }
    }, [dispatch])

    useEffect(() => {
        if (props.trigger) {
            document.addEventListener('click', closePopup);
            document.addEventListener('keydown', closePopup);
        } else {
            document.removeEventListener('click', closePopup);
            document.removeEventListener('keydown', closePopup);
            setSearchTerm("");
        }
    }, [props.trigger, closePopup]);

    useEffect(() => {
        if(props.trigger) {
            let search = document.getElementById("popup-game-search");
            if (search) {
                search.focus();
            }
        }
    }, [props.trigger, searchPopup]);

    useEffect(() => {
        // setup delay for the search bar
        const delayDebounce = setTimeout(() => {
            if (searchTerm && searchTerm !== "") {
                fetch('/api/game/search/' + searchTerm, { mode: 'cors', credentials: 'include' })
                    .then(function (response) {
                        if (response.status === 200) {
                            return response.json();
                        }
                    }).then(function (data) {
                        if (data) {
                            let searchResults = document.getElementById("popup-search-results");
                            // setting the search results now that we have data
                            if (searchResults) {
                                searchResults.innerHTML = "";
                                for (let i = 0; i < data.length; i++) {
                                    if (!data[i] || !data[i].document) {
                                        continue;
                                    }
                                    let cur_data = data[i].document;
                                    let new_el;
                                    // only when they call this popup trying to add a game to a specific wishlist
                                    if (searchPopup && searchPopup.addingGame) {
                                        new_el = document.createElement("p");
                                        new_el.innerHTML = "<li>" + cur_data.name + "</li>";
                                        new_el.onclick = async function (event) {
                                            // add the game to the wishlist then close the popup
                                            dispatch(setLoading(true));
                                            try {
                                                console.log(cur_data.appid, searchPopup.addingGame)
                                                let res_add = await axios.post('/api/game/add', { game_id: cur_data.appid, wishlists: [searchPopup.addingGame] });
                                                if (res_add.status === 200) {
                                                    dispatch(setEvent(true, "Game added to wishlist"));
                                                    if (wishlistItems && wishlistItems.owned && wishlistItems.owned[searchPopup.addingGame]) {
                                                        dispatch(addGameToWishlist(searchPopup.addingGame, "owned", cur_data.appid, cur_data.name))
                                                    } else if (wishlistItems && wishlistItems.shared && wishlistItems.shared[searchPopup.addingGame]) {
                                                        dispatch(addGameToWishlist(searchPopup.addingGame, "shared", cur_data.appid, cur_data.name))
                                                    }
                                                }
                                            } catch (error) {
                                                dispatch(setEvent(false, "Error adding game to wishlist"));
                                            }
                                            dispatch(setLoading(false));
                                            dispatch(setSearchPopup(false));
                                        }
                                    } else {
                                        // no wishlist to add to, so just make it a link to the game
                                        new_el = document.createElement("a");
                                        new_el.href = "/game/" + cur_data.appid;
                                        new_el.innerHTML = "<li>" + cur_data.name + "</li>";
                                    }

                                    if (new_el) {
                                        new_el.className = "popup-search-result";
                                        new_el.id = "popup-search-result" + i;
                                        new_el.title = cur_data.name;
                                        new_el.onmouseover = function (event) {
                                            for (let j = 0; j < searchResults.children.length; j++) {
                                                searchResults.children[j].style.backgroundColor = null;
                                            }
                                            event.currentTarget.style.backgroundColor = "#282e35";
                                            // searchPosition.current = i;
                                        };
                                        new_el.onmouseout = function (event) {
                                            event.target.style.backgroundColor = null;
                                        }
                                        searchResults.appendChild(new_el);
                                    }
                                }
                            }
                        }
                    });
            }
        }, searchDelay);

        // clear the timeout every time the input changes
        return () => clearTimeout(delayDebounce);
    }, [searchTerm, searchPopup, dispatch, wishlistItems]);

    return (
        props.trigger ?
            <div className="search-for-game-popup">
                <div id="search-for-game-popup-blur"></div>
                <div className="search-for-game-popup-inner">
                    <input type="text" id="popup-game-search" placeholder="Enter game name" autoComplete='off'
                        onChange={(e) => {
                            if (e.target.value !== searchTerm) {
                                setSearchTerm(e.target.value);
                            }
                        }}
                    />
                    <ul id="popup-search-results"></ul>
                </div>
            </div>
            : null
    );
}

export default SearchForGamePopup;