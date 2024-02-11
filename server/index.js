require('dotenv').config({path: __dirname + '/../.env'})
var { passport, login, logout, savePrevPageToSession, getUser } = require("./auth.js");
var express = require("express");
var Session = require("express-session");
var cors = require("cors");
var { admin } = require("./initFirebase.js");
const { v4: uuidv4 } = require('uuid');
var qs = require('querystring');
var { getWishlistPage, createWishlist, addGameToWishlist, getWishlists, getWishlistsPage} = require("./wishlist.js");
const { getGamePage, searchGamePage } = require("./game.js");

const app = express()

// set the server's views directory + view engine
app.set('views', __dirname + '/views');
app.set("view engine", "ejs")

app.use(cors({credentials: true, origin: 'http://localhost:3000'}));

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

app.get('/api/auth/steam', savePrevPageToSession, passport.authenticate('steam', { failureRedirect: '/', keepSessionInfo: true}));

app.get('/api/auth/steam/return', passport.authenticate('steam', { failureRedirect: '/', keepSessionInfo: true}), login);

app.post('/api/auth/logout', logout);

app.get('/api/user', getUser);

app.get('/api/wishlist', getWishlistsPage);

app.post('/api/wishlist/create', createWishlist);

app.get('/api/wishlist/:id', getWishlistPage);

app.get('/api/game/search/:query', searchGamePage);

app.get('/api/game/:game_id', getGamePage);

app.get('/api/game/add/:wishlist_id/:game_id', addGameToWishlist);

app.listen(3001);