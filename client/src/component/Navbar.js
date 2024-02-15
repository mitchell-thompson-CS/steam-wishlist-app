import axios from "axios";
import React, { useEffect, useRef, useState } from "react";

const searchDelay = 500;

const Navbar = () => {

    const [user, setUser] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    // var searchPosition = -1;
    const searchPosition = useRef(-1);

    useEffect(() => {
        
        if (user.length === 0){
            fetch('/api/user', { mode: 'cors', credentials: 'include' })
                .then(function (response) {
                    if (response.status === 200) {
                        return response.json();
                    }
                }).then(function (data) {
                    if (data) {
                        setUser(data);
                    }
                });
        }
        
        const delayDebounce = setTimeout(() => {
            if(searchTerm && searchTerm !== ""){
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
                            a.onmouseover = function(event) {
                                for(let j = 0; j < searchResults.children.length; j++) {
                                    searchResults.children[j].style.backgroundColor = null;
                                }
                                event.target.style.backgroundColor = "#282e35";
                                searchPosition.current = i;
                            };
                            a.onmouseout = function(event) {
                                event.target.style.backgroundColor = null;
                            }
                            searchResults.appendChild(a);
                        }

                    }
                });
            }
        }, searchDelay);

        document.onclick = function(event) {
            if (event.target.id !== "gameSearch" && event.target.id !== "gameSearchResults") {
                document.getElementById("gameSearchResults").style.display = "none";
            }
        }
        return () => clearTimeout(delayDebounce);
    }, [searchTerm, user]);

    async function logout() {
        try {
            let response = await axios.post('/api/auth/logout');
            if (response.status === 200) {
                setUser([]);
            }
        } catch (error) {
            console.error(error);
        }
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
            if (searchPosition.current === -1 && results.length > 0){
                searchPosition.current = 0;
            }
            else if (searchPosition.current < results.length - 1) {
                searchPosition.current = searchPosition.current + 1;
            }
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            if (searchPosition.current === -1){
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
                        <a href="/"><img id="logo" src="/logo.svg" alt="logo"/></a>
                    </li>
                    {/* <li>
                        <a href="http://localhost:3000/">HOME</a>
                    </li> */}
                    <li id="searchArea" onFocus={focusSearch} onKeyDown={handleSearchKeyDown}>
                        <form>
                            <input type="text" id="gameSearch" name="search" placeholder="Search..." autoComplete="off" 
                            onChange={(e) => {if(e.target.value !== searchTerm) {
                                setSearchTerm(e.target.value)
                            }}}/>
                        </form>
                        <ul id="gameSearchResults"></ul>
                    </li>
                    <li>
                        <a href="/wishlists">WISHLISTS</a>
                    </li>
                </ul>
                <ul className="right">
                    <li>
                        {user.name ?
                            <button className="signin" onClick={logout}>{user.name}</button> :
                            <a href={"/api/auth/steam?redir=" + encodeURIComponent(window.location.href)} className="signin">LOGIN</a>
                        }
                    </li>
                    <li>
                        {user.avatar ?
                         <img id="avatar" src={user.avatar} alt="avatar"/> :
                         <div></div>}
                    </li>
                </ul>
                <div className="clear"></div>
        </nav>
    );
}


export default Navbar;