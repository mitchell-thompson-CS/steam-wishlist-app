import { useParams } from 'react-router-dom';
import '../styles/SearchForGamePopup.css';
import { useCallback, useEffect, useRef, useState } from 'react';
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
    const searchPosition = useRef(0);

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
            searchPosition.current = 0;
            setSearchTerm(""); 
        }
    }, [props.trigger, closePopup]);

    useEffect(() => {
        let search = document.getElementById("popup-game-search");
        // focus on the search bar when the popup is opened
        if (props.trigger) {
            if (search) {
                search.focus();
            }
        } else {
            // clear the value in the search box
            if (search) {
                search.value = "";
            }
        }
    }, [props.trigger, searchPopup]);

    const handleSearchKeyDown = useCallback((e) => {
        if (e.key === "ArrowDown" || (e.key === "Tab" && e.shiftKey === false)) {
            e.preventDefault();
            let searchResults = document.getElementById("popup-search-results");
            if (searchResults && searchResults.children.length > 0) {
                if (searchPosition.current < searchResults.children.length) {
                    searchPosition.current = (searchPosition.current + 1) % (searchResults.children.length + 1);
                    searchResults.children[searchPosition.current - 1].focus();
                } else if (searchPosition.current === searchResults.children.length) {
                    searchPosition.current = 0;
                    let search = document.getElementById("popup-game-search");
                    if (search) {
                        search.focus();
                        search.select();
                    }
                }
            }
        } else if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey === true)) {
            e.preventDefault();
            let searchResults = document.getElementById("popup-search-results");
            if (searchResults && searchResults.children.length > 0) {
                if (searchPosition.current > 1) {
                    searchPosition.current -= 1;
                    searchResults.children[searchPosition.current - 1].focus();
                } else if (searchPosition.current === 1) {
                    searchPosition.current = 0;
                    let search = document.getElementById("popup-game-search");
                    if (search) {
                        search.focus();
                        search.select();
                    }
                } else if (searchPosition.current === 0) {
                    searchPosition.current = searchResults.children.length;
                    searchResults.children[searchPosition.current - 1].focus();
                }
            }
        } else if (e.key === "Enter") {
            e.preventDefault();
            let searchResults = document.getElementById("popup-search-results");
            if (searchResults && searchPosition.current > 0) {
                searchResults.children[searchPosition.current - 1].click();
            } else if (searchResults && searchResults.children.length > 0 && searchPosition.current === 0) {
                // click first thing in list if currently selecting search bar
                searchResults.children[0].click();
            }
        } else if (e.key !== "Shift") {
            searchPosition.current = 0;
            let search = document.getElementById("popup-game-search");
            if (search) {
                search.focus();
            }
        }
    }, []);

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
                                            event.currentTarget.focus();
                                        };

                                        new_el.tabIndex = -1;

                                        new_el.onkeydown = handleSearchKeyDown;
                                        searchResults.appendChild(new_el);
                                    }
                                }
                            }
                        }
                        // reset the search position after getting new data (or failing to)
                        searchPosition.current = 0;
                    });
            }
        }, searchDelay);

        // clear the timeout every time the input changes
        return () => clearTimeout(delayDebounce);
    }, [searchTerm, searchPopup, dispatch, wishlistItems, handleSearchKeyDown]);

    return (
        <div className="search-for-game-popup" style={{
            opacity: props.trigger ? 1 : 0,
            zIndex: props.trigger ? 100 : -1,
        }}>
            <div id="search-for-game-popup-blur" style={{
                opacity: props.trigger ? 1 : 0,
                visibility: props.trigger ? "visible" : "hidden",
                backdropFilter: props.trigger ? "blur(5px) opacity(1)" : "blur(0px) opacity(0)"
            }}></div>
            
                <div className="search-for-game-popup-inner" style={{
                    opacity: props.trigger ? 1 : 0,
                }}>
                    <input type="text" id="popup-game-search" placeholder="Enter game name" autoComplete='off' onKeyDown={handleSearchKeyDown}
                        onChange={(e) => {
                            if (e.target.value !== searchTerm) {
                                setSearchTerm(e.target.value);
                            }
                        }}
                    />
                    {props.trigger ?
                    <ul id="popup-search-results"></ul>
                    : null}
                </div> 
        </div>
    );
}

export default SearchForGamePopup;