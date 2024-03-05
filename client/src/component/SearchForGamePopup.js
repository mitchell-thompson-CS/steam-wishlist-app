import { useParams } from 'react-router-dom';
import '../styles/SearchForGamePopup.css';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchPopup } from '../actions/eventAction';

const searchDelay = 500;

const SearchForGamePopup = (props) => {

    const dispatch = useDispatch();
    const searchPopup = useSelector(state => state.eventReducer.searchPopup);
    const [searchTerm, setSearchTerm] = useState("");

    const closePopup = useCallback((e) => {
        if (e.target.className === "search-for-game-popup" || e.key === "Escape") {
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
        }
    }, [props.trigger, closePopup]);

    useEffect(() => {
        console.log(searchPopup);
    }, [searchPopup]);

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
                            searchResults.innerHTML = "";
                            for (let i = 0; i < data.length; i++) {
                                let cur_data = data[i].document;
                                let a = document.createElement("a");
                                a.href = "/game/" + cur_data.appid;
                                a.innerHTML = "<li>" + cur_data.name + "</li>";
                                a.className = "searchResult";
                                a.id = "searchResult" + i;
                                a.onmouseover = function (event) {
                                    for (let j = 0; j < searchResults.children.length; j++) {
                                        searchResults.children[j].style.backgroundColor = null;
                                    }
                                    event.target.style.backgroundColor = "#282e35";
                                    // searchPosition.current = i;
                                };
                                a.onmouseout = function (event) {
                                    event.target.style.backgroundColor = null;
                                }
                                searchResults.appendChild(a);
                            }

                        }
                    });
            }
        }, searchDelay);

        // clear the timeout every time the input changes
        return () => clearTimeout(delayDebounce);
    }, [searchTerm]);

    return (
        props.trigger ?
            <div className="search-for-game-popup">
                <div className="search-for-game-popup-inner">
                    <h1>Search for a game</h1>
                    <div id="popup-search-area">
                        <input type="text" id="popup-game-search" placeholder="Enter a game name" autoComplete='off'
                            onChange={(e) => {
                                if (e.target.value !== searchTerm) {
                                    setSearchTerm(e.target.value);
                                }
                            }}
                        />
                        <ul id="popup-search-results"></ul>
                    </div>
                </div>
            </div>
            : null
    );
}

export default SearchForGamePopup;