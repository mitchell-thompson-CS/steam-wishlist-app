require('dotenv').config({path: __dirname + '/../.env'})
var { passport, login, logout, savePrevPageToSession, getUser } = require("./auth.js");
var express = require("express");
var Session = require("express-session");
var cors = require("cors");
var { admin } = require("./initFirebase.js");
const { v4: uuidv4 } = require('uuid');
const rateLimitMiddleware = require('./rateLimitMiddleware.js');
var qs = require('querystring');
var { getWishlistPage, createWishlist, addGameToWishlist, getWishlistsPage, deleteWishlist, removeGameFromWishlist, addEditorToWishlist, deleteEditorFromWishlist} = require("./wishlist.js");
const { getGamePage, searchGamePage } = require("./game.js");

const app = express()

// set the server's views directory + view engine
app.set('views', __dirname + '/views');
app.set("view engine", "ejs")

// app.use(cors({credentials: true, origin: 'http://localhost:3000'}));
app.use(cors({credentials: true}));
app.use(rateLimitMiddleware);

// session config
app.use(Session({
    secret: 'your secret',
    name: 'session_id',
    resave: false,
    saveUninitialized: true
  }));

// maintains login state from session
app.use(passport.session());

// index path renders index.ejs with user data
app.get('/', async function(req, res){
  // var wishlists = await getWishlists(req);
  // res.render('index', { user: req.user, wishlists: wishlists });
  // TODO: send to react frontend
  res.sendStatus(200);
});

// auth paths
app.get('/api/auth/steam', savePrevPageToSession, passport.authenticate('steam', { failureRedirect: '/', keepSessionInfo: true}));

app.get('/api/auth/steam/return', passport.authenticate('steam', { failureRedirect: '/', keepSessionInfo: true}), login);

app.post('/api/auth/logout', logout);

// user path
app.get('/api/user', getUser);

// wishlist paths
app.get('/api/wishlists', getWishlistsPage);

app.get('/api/wishlist/:id', getWishlistPage);

app.post('/api/wishlist/create', createWishlist);

app.post('/api/wishlist/add-editor', addEditorToWishlist);

app.delete('/api/wishlist/delete-editor', deleteEditorFromWishlist);

app.delete('/api/wishlist/delete', deleteWishlist);

// game paths
app.get('/api/game/search/:query', searchGamePage);

app.get('/api/game/:game_id', getGamePage);

app.post('/api/game/add', addGameToWishlist);

app.delete('/api/game/remove', removeGameFromWishlist);

// TODO: we need to add delete api paths for stuff that we create as well

app.listen(3001);