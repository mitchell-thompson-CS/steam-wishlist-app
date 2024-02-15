import axios from "axios";
import React, { useEffect, useState } from "react";

const searchDelay = 500;

const Navbar = () => {

    const [user, setUser] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (user.length === 0){
            fetch('/api/user', { mode: 'cors', credentials: 'include' })
                .then(function (response) {
                    if (response.status === 200) {
                        return response.json();
                    }
                }).then(function (data) {
                    if (data) {
                        // user.current = data;
                        setUser(data);
                        // console.log(user);
                    }
                });
        }
        
        const delayDebounce = setTimeout(() => {
            if(searchTerm && searchTerm != ""){
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

    // function unFocusSearch(event) {
    //     let results = document.getElementById("gameSearchResults");
    //     if (!event.target.contains(results)){
    //         results.style.display = "none";
    //     }
    // }

    return (
        <nav>
                <ul className="left">

                    <li>
                        <a href="/"><img id="logo" src="/logo.svg" alt="logo"/></a>
                    </li>
                    {/* <li>
                        <a href="http://localhost:3000/">HOME</a>
                    </li> */}
                    <li id="searchArea" onFocus={focusSearch}>
                        <form>
                            <input type="text" id="gameSearch" name="search" placeholder="Search..." autoComplete="off" onChange={(e) => setSearchTerm(e.target.value)}/>
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