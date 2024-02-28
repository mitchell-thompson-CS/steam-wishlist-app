const express = require("express");
const Session = require("express-session");
const cors = require("cors");
const passport = require("passport");
const { login, logout, savePrevPageToSession, getUser, isLoggedIn } = require("./auth.js");
const { getWishlists, createWishlist, deleteWishlist } = require("./wishlists.js");
const { renameWishlist, getWishlistInner, addGameToWishlist, removeGameFromWishlist, addEditorToWishlist, deleteEditorFromWishlist } = require("./wishlistInner.js");
const { getGamePage, searchGamePage } = require("./game.js");
const { lowRateLimit, mediumRateLimit, highRateLimit } = require("./rateLimit.js");

const app = express()

// set the server's views directory + view engine
app.set('views', __dirname + '/views');
app.set("view engine", "ejs")

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
// app.use(rateLimitMiddleware);

// session config
app.use(Session({
    secret: 'your secret',
    name: 'session_id',
    resave: false,
    saveUninitialized: true
}));

app.use(express.json());

// maintains login state from session
app.use(passport.session());

// index path renders index.ejs with user data
app.get('/', async function (req, res) {
    // TODO: send to react frontend
    res.sendStatus(200);
});

// auth paths
app.get('/api/auth/steam', mediumRateLimit, savePrevPageToSession, passport.authenticate('steam', { failureRedirect: '/', keepSessionInfo: true }));

app.get('/api/auth/steam/return', lowRateLimit, passport.authenticate('steam', { failureRedirect: '/', keepSessionInfo: true }), isLoggedIn, login);

app.post('/api/auth/logout', isLoggedIn, mediumRateLimit, logout);

// user path
app.get('/api/user', isLoggedIn, highRateLimit, getUser);

// wishlist paths
app.get('/api/wishlists', isLoggedIn, lowRateLimit, getWishlists);

app.get('/api/wishlist/:id', isLoggedIn, mediumRateLimit, getWishlistInner);

app.post('/api/wishlist/create', isLoggedIn, mediumRateLimit, createWishlist);

app.post('/api/wishlist/add-editor', isLoggedIn, mediumRateLimit, addEditorToWishlist);

app.delete('/api/wishlist/delete-editor', isLoggedIn, mediumRateLimit, deleteEditorFromWishlist);

app.delete('/api/wishlist/delete', isLoggedIn, mediumRateLimit, deleteWishlist);

app.post('/api/wishlist/rename', isLoggedIn, mediumRateLimit, renameWishlist);

app.post('/api/game/add', isLoggedIn, mediumRateLimit, addGameToWishlist);

app.delete('/api/game/remove', isLoggedIn, mediumRateLimit, removeGameFromWishlist);

// game paths
app.get('/api/game/search/:query', mediumRateLimit, searchGamePage);

app.get('/api/game/:game_id', mediumRateLimit, getGamePage);

exports.app = app;