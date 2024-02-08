import React from "react";

async function Test(){
    fetch('http://localhost:3001/wishlist', {mode: 'cors', credentials: 'include'})
    .then(function(response) {
        return response.json();
    }).then(function(data) {
        console.log(data);
    });
}

const Login = () => {
    return (
        <div>
            <h1>Login</h1>
            <a href="http://localhost:3001/steam/login?redir=http://localhost:3000/login">Login with Steam</a>
            <br></br>
            <button onClick={Test}>Test</button>
        </div>
    );
}


export default Login;