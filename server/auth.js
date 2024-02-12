var SteamStrategy = require("passport-steam");
var passport = require("passport");

var firebase_auth = require("firebase/auth");
var { admin } = require("./initFirebase");

const auth = firebase_auth.getAuth();

const base_url = `${process.env.API_BASE_URL}`

// this gets called whenever a user logs in (for the first time only i think)
// stores only the information from the user that we find relevant (in this case id, name, and avatar)
passport.serializeUser(function (user, done) {
  // console.log(user);
  done(null, {
    id: user.id,
    name: user.displayName,
    avatar: user.photos[1].value
  });
});

// this gets called whenever a user loads a page
// basically just returns the user object we created in serializeUser
passport.deserializeUser(function (obj, done) {
  done(null, obj)
});

passport.use(new SteamStrategy({
  returnURL: base_url + '/api/auth/steam/return',
  realm: base_url + '/',
  apiKey: `${process.env.PASSPORT_API_KEY}`
},
  function (identifier, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      // To keep the example simple, the user's Steam profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Steam account with a user record in your database,
      // and return that user instead.
      profile.identifier = identifier;
      return done(null, profile);
    });
  }
));

async function savePrevPageToSession(req, res, next) {
  req.session.prevPage = req.query.redir;
  await req.session.save(() => {
    next();
  });
}

function login(req, res) {
  var oid = req.query["openid.claimed_id"];
  var array = oid.split("/id/");
  var result = array[1];
  admin.auth().createCustomToken(result)
    .then(function (customToken) {
      // console.log("created custom token?");
      doc = admin.firestore().collection('users').doc(result).get().then((docSnapshot) => {
        if (!docSnapshot.exists) {
          console.log("User does not exist, creating new user");
          admin.firestore().collection('users').doc(result).set({
            wishlists: {},
            shared_wishlists: {}
          });
        }
      });

      // Send token back to client
      firebase_auth.signInWithCustomToken(auth, customToken)
        .catch(function (error) {
          if (error) {
            console.log(error)
            res.sendStatus(500);
          }
        })
        .then(() => {
          // console.log(req.user)
          console.log("Signed in as " + req.user?.displayName + " with custom token on firebase");
          if (!res.headersSent) {
            res.redirect(req.session.prevPage);
          }
        })
    })
}

// logs out the user via a post request
// sends a 200 status code if successful
function logout(req, res) {
  if (req.user) {
    console.log("Logging out of " + req.user?.name)
    req.logout(function (err) {
      if (err) {
        console.log(err);
        res.sendStatus(500);
      }
      if (!res.headersSent) {
        res.sendStatus(200);
      }
    });
  } else {
    res.sendStatus(401);
  }
}

function getUser(req, res) {
  if (req.user) {
    res.send(req.user);
  } else {
    res.sendStatus(401);
  }
}

exports.passport = passport;
exports.login = login;
exports.logout = logout;
exports.savePrevPageToSession = savePrevPageToSession;
exports.getUser = getUser;