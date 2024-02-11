import axios from "axios";
import React, { useCallback, useEffect, useRef, useState } from "react";

const Navbar = () => {

    const [user, setUser] = useState([]);

    useEffect(() => {
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
    }, []);

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

    return (
        <nav>
                <ul className="left">

                    <li>
                        <a href="/"><img id="logo" src="/logo.svg"/></a>
                    </li>
                    {/* <li>
                        <a href="http://localhost:3000/">HOME</a>
                    </li> */}
                    <li id="searchArea">
                        <form>
                            <input type="text" id="search" name="search" placeholder="Search..."/>
                        </form>
                    </li>
                    <li>
                        <a href="wishlists">WISHLISTS</a>
                    </li>
                </ul>
                <ul className="right">
                    <li>
                        {user.name ?
                            <a href="#" className="signin" onClick={logout}>{user.name}</a> :
                            <a href="/api/auth/steam?redir=http://localhost:3000" className="signin">LOGIN</a>
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