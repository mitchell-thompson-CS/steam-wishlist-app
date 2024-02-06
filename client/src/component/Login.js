import React from "react";

function test() {
    console.log("test");
    fetch('http://localhost:3001/steam/login', {mode: 'cors'}).then((response) => {
        console.log(response);
    });
}

const Login = () => {
    return (
        <div>
            <h1>Login</h1>
            <a href="http://localhost:3001/steam/login?redir=localhost:3000/login">Login with Steam</a>
            <button onClick={test}>Test</button>
        </div>
    );
}


export default Login;