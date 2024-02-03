var { passport, login, logout } = require("./auth.js");
var express = require("express");
var Session = require("express-session");
var { admin } = require("./initFirebase.js");
const { v4: uuidv4 } = require('uuid');
require('dotenv').config()
var qs = require('querystring');
const { searchForGame } = require('./typesense.js');

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
  var wishlists = await getWishLists(req)
  // req.session.wishlists = wishlists;
  // req.session.save();
  // console.log(wishlists)
  // console.log(req.session.wishlists)
  res.render('index', { user: req.user, wishlists: wishlists });
});

// login path redirects to index after authenticating with Steam
app.get('/steam/login', passport.authenticate('steam', {failureRedirect: '/'}), login);

async function getWishLists(req) {
  // console.log(req);
  if (req.user) {
    return await admin.firestore().collection('users').doc(req.user.id).get().then(async (docSnapshot) => {
      if (docSnapshot.exists) {
        // req.session.wishlists = docSnapshot.data().wishlists;
        // req.session.save();
        var db_wishlists = docSnapshot.data().wishlists;
        // console.log(db_wishlists)
        if (db_wishlists.length > 0) {
          return await admin.firestore().getAll(...db_wishlists).then((wishlists) => {
          // req.session.wishlists = wishlists;
          // req.session.save();
          final_wishlists = [];
          for (var wishlist of wishlists){
            // console.log(wishlist.id)
            var wishlist_data = wishlist.data();
            wishlist_data['id'] = wishlist.id;
           final_wishlists.push(wishlist_data); 
          }
          // console.log(final_wishlists)
          return final_wishlists;
          })
        } else {
          return [];
        }
      } 
    });
  }
}

app.post('/wishlist/create', function(req, res){
  // console.log(req);
  var body = '';
  req.on('data', function (data) {
      body += data;

      if (body.length > 1e6)
        req.socket.destroy();
  });

  req.on('end', function () {
      var post = qs.parse(body);
      // console.log(post);
      var wishlist_name = post['wishlist_name'];
      console.log('creating a new wishlist: ' + wishlist_name);
      var new_id = uuidv4();

      // console.log('id: ' + new_id);
      // console.log('user: ' + req.session.passport.user.id);

      wishdoc = admin.firestore().collection('wishlists').doc(new_id).get().then((wishsnapshot) => {
        if (wishsnapshot.exists) {
          console.log("wishlist already exists");
        } else {
          admin.firestore().collection('wishlists').doc(new_id).set({
            editors: {},
            name: post['wishlist_name'],
            games: {},
            owner: admin.firestore().collection('users').doc(req.session.passport.user.id)
          }).then(() => {
            // console.log("wishlist created in collection");
            admin.firestore().collection('users').doc(req.session.passport.user.id).update({
              wishlists: admin.firestore.FieldValue.arrayUnion(admin.firestore().collection('wishlists').doc(new_id))
            }).then(() => {
              // console.log("wishlist added to user");
              res.redirect('/');
            });
          });
        }
      })
  });
});

app.get('/wishlist/:id', async function(req, res){
  if (req.user) {
    var wishlist = await admin.firestore().collection('wishlists').doc(req.params.id).get().then((wishsnapshot) => {
      if (wishsnapshot.exists) {
        var data = wishsnapshot.data();
        data['id'] = req.params.id;
        if (data.editors[req.user.id] || data.owner.id == req.user.id) {
          res.render('wishlist', { user: req.user, wishlist: data });
        } else {
          res.redirect('/');
        }
      } else {
        console.log(req.user.name + " tried to access a wishlist that doesn't exist");
        res.redirect('/');
      }
    })
  } else {
    res.redirect('/');
  }
});

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

app.get('/game/add/:wishlist_id/:game_id', async function(req, res){
  if (req.user) {
    await admin.firestore().collection('wishlists').doc(req.params.wishlist_id).get().then((wishsnapshot) => {
      if (wishsnapshot.exists) {
        // console.log(wishsnapshot.data());
        var data = wishsnapshot.data();

        if (data.editors[req.user.id] || data.owner.id == req.user.id) {
          getGameData(req.params.game_id).then((gameData) => {
            
            admin.firestore().collection('wishlists').doc(req.params.wishlist_id).update({
              [`games.${req.params.game_id}`]: gameData[req.params.game_id]['data']['name']
            }).then(() => {
              res.redirect('/wishlist/' + req.params.wishlist_id)
            });
          })
        } else {
          res.redirect('/');
        }
      } else {
        console.log(req.user.name + " tried to add a game to a wishlist that doesn't exist");
        res.redirect('/');
      }
    })
  } else {
    res.redirect('/');
  }
});

// login return path (specified by returnURL in passport's SteamStrategy) redirects to index after authenticating with steam
// app.get('/steam/login/return', passport.authenticate('steam', {failureRedirect: '/'}), function(req, res){
//   res.redirect('/')
// })

// logout path redirects to index
app.get('/logout', logout);


app.listen(3001);