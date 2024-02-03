var { passport, login, logout } = require("./auth.js");
var express = require("express");
var Session = require("express-session");
var { admin } = require("./initFirebase.js");
const { v4: uuidv4 } = require('uuid');
require('dotenv').config()
var qs = require('querystring');
var { getWishlistPage, createWishlist, addGameToWishlist, getWishlists } = require("./wishlist.js");
const { getGamePage, searchGamePage } = require("./game.js");

const app = express()

// set the server's views directory + view engine
app.set('views', __dirname + '/views');
app.set("view engine", "ejs")

// session config
app.use(Session({
    secret: 'your secret',
    name: 'session_id',
    resave: true,
    saveUninitialized: false
  }));

// maintains login state from session
app.use(passport.session());

// index path renders index.ejs with user data
app.get('/', async function(req, res){
  var wishlists = await getWishlists(req);
  res.render('index', { user: req.user, wishlists: wishlists });
});

app.get('/steam/login', passport.authenticate('steam', {failureRedirect: '/'}), login);

app.post('/wishlist/create', createWishlist);

app.get('/wishlist/:id', getWishlistPage);

app.get('/game/search/:query', searchGamePage);

app.get('/game/:game_id', getGamePage);

app.get('/game/add/:wishlist_id/:game_id', addGameToWishlist);

app.get('/logout', logout);


app.listen(3001);