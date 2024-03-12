import axios from "axios";
import React, { useEffect, useState } from "react";
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

    return (
        <nav>
            <ul className="left">
                <li>
                    <Link className="navPage" to="/"><img id="logo" src="/logo.svg" alt="logo" /></Link>
                </li>
                <li id="searchArea" onFocus={focusSearch}>
                    <form>
                        <input type="text" id="gameSearch" name="search" placeholder="Search..." autoComplete="off"
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
            <ul className="right">
                <li>
                    {user.name ?
                        <button className="signin" onClick={logout}>{user.name}</button> :
                        <a href={"/api/auth/steam?redir=" + encodeURIComponent(window.location.href)}
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