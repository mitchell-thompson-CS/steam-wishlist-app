var { passport, login, logout } = require("./auth.js");
var express = require("express");
var Session = require("express-session");
var { admin } = require("./initFirebase.js");
const { v4: uuidv4 } = require('uuid');
require('dotenv').config()
var qs = require('querystring');
const { searchForGame } = require('./typesense.js');
var { getWishlistPage, createWishlist, addGameToWishlist, getWishlists } = require("./wishlist.js");

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
  var wishlists = await getWishlists(req)
  // req.session.wishlists = wishlists;
  // req.session.save();
  // console.log(wishlists)
  // console.log(req.session.wishlists)
  res.render('index', { user: req.user, wishlists: wishlists });
});

// login path redirects to index after authenticating with Steam
app.get('/steam/login', passport.authenticate('steam', {failureRedirect: '/'}), login);


app.post('/wishlist/create', createWishlist);

app.get('/wishlist/:id', getWishlistPage);

app.get('/game/search/:query', async function(req, res){
  if (req.user) {
    let query = req.params.query;
    // console.log("Searching for " + query);
    let gameList = await searchForGame(query, 5);
    res.send(gameList.hits);
    // console.log('sent game list');
  } else {
    res.redirect('/');
  }
});

app.get('/game/:game_id', function(req, res){
  console.log('searching for game id ' + req.params.game_id)
  getGameData(req.params.game_id).then((data) => {
    if (data[req.params.game_id]['success']) {
      let entry = data[req.params.game_id]['data'];
      // we want type, name, dlc, short_description, header_image, website, pc_requirements, mac_requirements, linux_requirements, developers, publishers, price_overview, platforms, categories, genres, release_date
      let gameData = {
        'type': entry['type'],
        'name': entry['name'],
        'dlc': entry['dlc'],
        'short_description': entry['short_description'],
        'header_image': entry['header_image'],
        'website': entry['website'],
        'pc_requirements': entry['pc_requirements'],
        'mac_requirements': entry['mac_requirements'],
        'linux_requirements': entry['linux_requirements'],
        'developers': entry['developers'],
        'publishers': entry['publishers'],
        'price_overview': entry['price_overview'],
        'platforms': entry['platforms'],
        'categories': entry['categories'],
        'genres': entry['genres'],
        'release_date': entry['release_date'],
        'reviews': entry['reviews']
      }

      // console.log(gameData)
      res.render('game', { gameData: gameData });
      // https://store.steampowered.com/appreviews/105600?json=1
    } else {
      res.redirect('/');
    }
  });
});

async function getGameData(appid) {
  let currency = 'USD';
  return await fetch('https://store.steampowered.com/api/appdetails?currency=' + currency + '&appids=' + appid)
  .then(response => response.json())
  .then(async (data) => {
    return await fetch('https://store.steampowered.com/appreviews/' + appid + '?json=1')
    .then(response => response.json())
    .then(reviewData => {
      if (reviewData['success'] && data[appid]['success']) {
        data[appid]['data']['reviews'] = reviewData['query_summary'];
      }
      return data;
    })
  })
}

app.get('/game/add/:wishlist_id/:game_id', addGameToWishlist);

// login return path (specified by returnURL in passport's SteamStrategy) redirects to index after authenticating with steam
// app.get('/steam/login/return', passport.authenticate('steam', {failureRedirect: '/'}), function(req, res){
//   res.redirect('/')
// })

// logout path redirects to index
app.get('/logout', logout);


app.listen(3001);