import React, { useCallback, useEffect, useRef, useState } from "react";

const Navbar = () => {

    const [user, setUser] = useState([]);

    useEffect(() => {
        fetch('http://localhost:3001/user', { mode: 'cors', credentials: 'include' })
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

    return (
        <nav>
                <ul className="left">

                    <li>
                        <a href="http://localhost:3000"><img id="logo" src="http://localhost:3000/logo.svg"/></a>
                    </li>
                    {/* <li>
                        <a href="http://localhost:3000/">HOME</a>
                    </li> */}
                    <li id="searchArea">
                        <form>
                            <input type="text" id="search" name="search" placeholder="Search.."/>
                        </form>
                    </li>
                    <li>
                        <a href="http://localhost:3000/wishlists">WISHLISTS</a>
                    </li>
                </ul>
                <ul className="right">
                    <li>
                        {user.name ?
                            <a href="http://localhost:3001/logout?redir=http://localhost:3000" className="signin">{user.name}</a> :
                            <a href="http://localhost:3001/steam/login?redir=http://localhost:3000" className="signin">LOGIN</a>
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