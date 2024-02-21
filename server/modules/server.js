const express = require("express");
const Session = require("express-session");
const cors = require("cors");
const passport = require("passport");
const { login, logout, savePrevPageToSession, getUser, isLoggedIn } = require("./auth.js");
const { getWishlists, createWishlist, deleteWishlist } = require("./wishlists.js");
const { renameWishlist, getWishlistInner, addGameToWishlist, removeGameFromWishlist, addEditorToWishlist, deleteEditorFromWishlist } = require("./wishlistInner.js");
const { getGamePage, searchGamePage } = require("./game.js");

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
    // var wishlists = await getWishlists(req);
    // res.render('index', { user: req.user, wishlists: wishlists });
    // TODO: send to react frontend
    res.sendStatus(200);
});

// auth paths
app.get('/api/auth/steam', savePrevPageToSession, passport.authenticate('steam', { failureRedirect: '/', keepSessionInfo: true }));

app.get('/api/auth/steam/return', passport.authenticate('steam', { failureRedirect: '/', keepSessionInfo: true }), isLoggedIn, login);

app.post('/api/auth/logout', isLoggedIn, logout);

// user path
app.get('/api/user', isLoggedIn, getUser);

// wishlist paths
app.get('/api/wishlists', isLoggedIn, getWishlists);

app.get('/api/wishlist/:id', isLoggedIn, getWishlistInner);

app.post('/api/wishlist/create', isLoggedIn, createWishlist);

app.post('/api/wishlist/add-editor', isLoggedIn, addEditorToWishlist);

app.delete('/api/wishlist/delete-editor', isLoggedIn, deleteEditorFromWishlist);

app.delete('/api/wishlist/delete', isLoggedIn, deleteWishlist);

app.post('/api/wishlist/rename', isLoggedIn, renameWishlist);

app.post('/api/game/add', isLoggedIn, addGameToWishlist);

app.delete('/api/game/remove', isLoggedIn, removeGameFromWishlist);

// game paths
app.get('/api/game/search/:query', searchGamePage);

app.get('/api/game/:game_id', getGamePage);

exports.app = app;