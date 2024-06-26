const express = require("express");
const Session = require("express-session");
const cors = require("cors");
const passport = require("passport");
const { login, logout, savePrevPageToSession, getUser, isLoggedIn } = require("./auth.js");
const { getWishlists, createWishlist, deleteWishlist } = require("./wishlists.js");
const { renameWishlist, getWishlistInner, addGameToWishlists, removeGameFromWishlists, addEditorToWishlist, deleteEditorFromWishlist } = require("./wishlistInner.js");
const { getGamePage, searchGamePage, getGamesPage } = require("./game.js");
const { lowRateLimit, mediumRateLimit, highRateLimit } = require("./rateLimit.js");
const { getFeatured, getTopSellers } = require("./home.js");
const path = require('path')

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

// frontend
app.use(express.static(path.resolve(__dirname, '../../client/build')));

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

app.post('/api/game/add', isLoggedIn, mediumRateLimit, addGameToWishlists);

app.delete('/api/game/remove', isLoggedIn, mediumRateLimit, removeGameFromWishlists);

// game paths
app.get('/api/game/search/:query', mediumRateLimit, searchGamePage);

app.get('/api/game/:game_id', mediumRateLimit, getGamePage);

app.get('/api/games/:game_ids', mediumRateLimit, getGamesPage);

// home paths
app.get('/api/home/featured', mediumRateLimit, getFeatured);

app.get('/api/home/top-sellers', mediumRateLimit, getTopSellers);

// All other GET requests not handled before will return our React app
app.get('/*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../client/build', 'index.html'));
  });

exports.app = app;