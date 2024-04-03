import axios from "axios";
import React, { useCallback, useEffect, useRef, useState } from "react";
import '../styles/Navbar.css'
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { deleteUser, isUser, setUser } from "../actions/userAction";
import { setEvent, setLoading, setSearchPopup } from "../actions/eventAction";

// TODO: currently if user hits log in, then goes back, then forward, then successfully logs in
// the user will not be updated. This is because the user is only updated when the page is loaded

const Navbar = () => {

    const user = useSelector(state => state.userReducer.user);
    const [searchTerm, setSearchTerm] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [showHiddenNav, setShowHiddenNav] = useState(false);
    const [width, setWidth] = useState(window.innerWidth);

    useEffect(() => {
        // deal with setting the users state (if it needs setting)
        if (!isUser(user)) {
            dispatch(setLoading(true));
            fetch('/api/user', { mode: 'cors', credentials: 'include', cache: 'no-cache' })
                .then(function (response) {
                    if (response.status === 200) {
                        return response.json();
                    }
                }).then(function (data) {
                    if (data) {
                        dispatch(setUser(data.id, data.name, data.avatar));
                    }
                    dispatch(setLoading(false));
                });
        }
    }, [user, dispatch]);

    async function logout() {
        try {
            let response = await axios.post('/api/auth/logout');
            if (response.status === 200) {
                successfulLogout();
            }
        } catch (error) {
            if (error.response.status === 401) {
                successfulLogout();
            }
            console.error(error);
        }
    }

    function successfulLogout() {
        navigate("/");
        dispatch(deleteUser());
        dispatch(setEvent(true, "Successfully logged out"));
    }

    function focusSearch(event) {
        // document.getElementById("gameSearchResults").style.display = "block";
        dispatch(setSearchPopup(true));
    }

    let closeNav;
    let clickAwayFromNav;
    
    closeNav = useCallback(() => {
        let navItems = document.getElementById("navItems");
        navItems.style.width = "";
        document.removeEventListener("click", clickAwayFromNav);
        setShowHiddenNav(false);
    }, [clickAwayFromNav]);

    clickAwayFromNav = useCallback((e) => {
        if (e.target && e.target.id !== "navItems"
            && e.target.id !== "expandListsvg"
            && e.target.id !== "expandList"
            && e.target.parentElement
            && e.target.parentElement.id !== "expandListsvg"
            && e.target.parentElement.id !== "expandList") {
            closeNav();
        }
    }, [closeNav]);

    

    function expandNav() {
        let navItems = document.getElementById("navItems");
        if (navItems) {
            if (showHiddenNav === false) {
                navItems.style.visibility = "visible";
                navItems.style.width = "80vw";
                document.addEventListener("click", clickAwayFromNav);
                setShowHiddenNav(true);
            } else {
                closeNav();
            }
        }
    }

    function resizeEvent(e) {
        setWidth(window.innerWidth);
    }

    useEffect(() => {
        let navItems = document.getElementById("navItems");
        navItems.onanimationend = () => {
            if (navItems.style.width === "") {
                navItems.style.visibility = "";
            }
        }

        window.addEventListener("resize", resizeEvent)
    }, [])

    useEffect(() => {
        if(width > 650) {
            document.removeEventListener("click", clickAwayFromNav);
            setShowHiddenNav(false);
        }
    }, [width, clickAwayFromNav]);

    return (
        <nav>
            <ul className="left">
                <li id="expandList" onClick={expandNav}>
                    <svg id="expandListsvg" width="45px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6H20M4 12H20M4 18H20" stroke={showHiddenNav?"#335d94":"#FFF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </li>
                <ul id="navItems" style={width > 650 ? {width: ""} : {}}>
                    <li>
                        <Link className="navPage" to="/"><img id="logo" src="/logo.svg" alt="logo" /></Link>
                    </li>
                    <li id="searchArea" onFocus={focusSearch}>
                        <form>
                            <input type="text" className="gameSearch" name="search" placeholder="Search..." autoComplete="off"
                                onChange={(e) => {
                                    if (e.target.value !== searchTerm) {
                                        setSearchTerm(e.target.value)
                                    }
                                }}
                                tabIndex={"-1"}
                            />
                        </form>
                        <ul id="gameSearchResults"></ul>
                    </li>
                    <li>
                        <Link className="navPage" to="/wishlists">WISHLISTS</Link>
                    </li>
                </ul>
            </ul>
            <div id="middleNavSearch" onFocus={focusSearch}>
                <input type="text" className="gameSearch" name="search" placeholder="Search..." autoComplete="off"
                    tabIndex={"-1"}
                />
            </div>
            <ul className="right">
                <li id="avatar-container" style={!user.avatar ? {width: 0, height: 0} : {}}>
                    {user.avatar ?
                        <img id="avatar" src={user.avatar} alt="avatar" onClick={logout} /> :
                        <div></div>}
                </li>
                <li>
                    {user.name ?
                        <button className="signin" id="username" onClick={logout}>{user.name}</button> :
                        <a href={"/api/auth/steam?redir=" + encodeURIComponent(window.location.href)}
                            className="signin">LOGIN</a>
                    }
                </li>
            </ul>
        </nav>
    );
}


export default Navbar;