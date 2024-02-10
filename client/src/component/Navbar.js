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
        <div className="navbar">
            <a href="http://localhost:3000/">HOME</a>
            <a href="http://localhost:3000/wishlists">WISHLISTS</a>
            {user.name ?
                <div>
                    <img className="signin" id="avatar" src={user.avatar}/>
                    <a href="http://localhost:3001/logout?redir=http://localhost:3000" className="signin">{user.name}</a> 
                </div> :
                <a href="http://localhost:3001/steam/login?redir=http://localhost:3000" className="signin">LOGIN</a>
            }
        </div>
    );
}


export default Navbar;