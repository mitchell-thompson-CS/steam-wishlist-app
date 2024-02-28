import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import '../Navbar.css'
import { Link, useLocation } from "react-router-dom";

const searchDelay = 500;

// TODO: currently if user hits log in, then goes back, then forward, then successfully logs in
// the user will not be updated. This is because the user is only updated when the page is loaded

const Navbar = () => {

    const [user, setUser] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const searchPosition = useRef(-1);
    const[loggingIn, setLoggingIn] = useState(false);
    const location = useLocation();

    useEffect(() => {
        // deal with setting the users state (if it needs setting)
        let sessionUser = sessionStorage.getItem('user');
        if ((sessionUser === null || sessionUser === "false") && !loggingIn) {
            console.log("getting user")
            fetch('/api/user', { mode: 'cors', credentials: 'include', cache: 'no-cache'})
                .then(function (response) {
                    if (response.status === 200) {
                        return response.json();
                    }
                }).then(function (data) {
                    if (data) {
                        setUser(data);
                        sessionStorage.setItem('user', JSON.stringify(data));
                    } else {
                        sessionStorage.setItem('user', JSON.stringify({}));
                    }
                });
        } else if(user === null || user.length === 0) {
            try {
                setUser(JSON.parse(sessionUser));
            } catch (error) {
                console.error(error);
            }
        }
    }, [user, loggingIn]);

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
                            let searchResults = document.getElementById("gameSearchResults");
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
                                    searchPosition.current = i;
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

        // setup click away for search results (so they disappear when clicked away from)
        document.onclick = function (event) {
            if (event.target.id !== "gameSearch" && event.target.id !== "gameSearchResults") {
                let searchResults = document.getElementById("gameSearchResults");
                searchResults.style.display = "none";
                for (let j = 0; j < searchResults.children.length; j++) {
                    searchResults.children[j].style.backgroundColor = null;
                }
                searchPosition.current = -1;
            }
        }
        return () => clearTimeout(delayDebounce);
    }, [searchTerm]);

    useEffect(() => {
        let pages = document.getElementsByClassName("navPage");
        for (let i = 0; i < pages.length; i++) {
            if (pages[i].pathname === location.pathname) {
                pages[i].id = "focusNav"
            } else {
                pages[i].id = ""
            }
        }
    }, [location]);

    async function logout() {
        try {
            let response = await axios.post('/api/auth/logout');
            if (response.status === 200) {
                sessionStorage.setItem('user', JSON.stringify({}));
                setUser({});
            }
        } catch (error) {
            if (error.response.status === 401) {
                sessionStorage.setItem('user', JSON.stringify({}));
                setUser({});
            }
            console.error(error);
        }
    }

    async function login() {
        setLoggingIn(true);
        // removeCookie('user');
        sessionStorage.setItem('user', false);
    }

    function focusSearch(event) {
        document.getElementById("gameSearchResults").style.display = "block";
    }

    function handleSearchKeyDown(event) {
        // event.preventDefault();
        let results = document.getElementsByClassName("searchResult");

        if (searchPosition.current !== -1) {
            results[searchPosition.current].dispatchEvent(new Event("mouseout"));
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            if (searchPosition.current === -1 && results.length > 0) {
                searchPosition.current = 0;
            }
            else if (searchPosition.current < results.length - 1) {
                searchPosition.current = searchPosition.current + 1;
            }
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            if (searchPosition.current === -1) {
                searchPosition.current = results.length - 1;
            } else if (searchPosition.current > 0 && results.length > 0) {
                searchPosition.current = searchPosition.current - 1;
            }
        } else if (event.key === "Enter") {
            event.preventDefault();
            if (searchPosition.current !== -1) {
                results[searchPosition.current].click();
            }
        }

        if (searchPosition.current !== -1) {
            results[searchPosition.current].dispatchEvent(new Event("mouseover"));
        }
    }

    return (
        <nav>
            <ul className="left">
                <li>
                    <Link className="navPage" to="/"><img id="logo" src="/logo.svg" alt="logo" /></Link>
                </li>
                <li id="searchArea" onFocus={focusSearch} onKeyDown={handleSearchKeyDown}>
                    <form>
                        <input type="text" id="gameSearch" name="search" placeholder="Search..." autoComplete="off"
                            onChange={(e) => {
                                if (e.target.value !== searchTerm) {
                                    setSearchTerm(e.target.value)
                                }
                            }} />
                    </form>
                    <ul id="gameSearchResults"></ul>
                </li>
                <li>
                    <Link className="navPage" to="/wishlists">WISHLISTS</Link>
                </li>
            </ul>
            <ul className="right">
                <li>
                    {user.name ?
                        <button className="signin" onClick={logout}>{user.name}</button> :
                        <a href={"/api/auth/steam?redir=" + encodeURIComponent(window.location.href)} 
                        onClick={login}
                        className="signin">LOGIN</a>
                    }
                </li>
                <li>
                    {user.avatar ?
                        <img id="avatar" src={user.avatar} alt="avatar" /> :
                        <div></div>}
                </li>
            </ul>
            <div className="clear"></div>
        </nav>
    );
}


export default Navbar;