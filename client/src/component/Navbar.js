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
                <ul>

                    <li>
                        <a href="http://localhost:3000"><img id="logo" src="http://localhost:3000/logo.svg"/></a>
                    </li>
                    <li>
                        <a href="http://localhost:3000/">HOME</a>
                    </li>
                    <li>
                        <a href="http://localhost:3000/wishlists">WISHLISTS</a>
                    </li>
                    <li id="moveright">
                        {user.name ?
                            <div className="signin">
                                <img id="avatar" src={user.avatar}/>
                                <a href="http://localhost:3001/logout?redir=http://localhost:3000">{user.name}</a> 
                            </div> :
                            <a href="http://localhost:3001/steam/login?redir=http://localhost:3000" className="signin">LOGIN</a>
                        }
                    </li>
                    <div className="clear"></div>
                </ul>
        </nav>
    );
}


export default Navbar;