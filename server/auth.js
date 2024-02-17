var SteamStrategy = require("passport-steam");
var passport = require("passport");

var firebase_auth = require("firebase/auth");
var { admin, getDb } = require("./initFirebase");
const { Logging, LogLevels } = require("./errors");

const auth = firebase_auth.getAuth();

// const db = getDb();

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

/** Saves the previous page to the session so we can redirect back to it after logging in.
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {*} next 
 */
async function savePrevPageToSession(req, res, next) {
  req.session.prevPage = req.query.redir;
  await req.session.save(() => {
    next();
  });
}

/** Logs in the user and creates a custom token for them to use with firebase.
 * 
 * @param {Request} req
 * @param {Response} res
 */
function login(req, res) {
  // TODO: should we change this to user req.user.id? this may be security issue rn???
  var oid = req.query["openid.claimed_id"];
  var array = oid.split("/id/");
  var result = array[1];
  admin.auth().createCustomToken(result)
    .then(function (customToken) {
      // console.log("created custom token?");
      doc = getDb().collection('users').doc(result).get().then((docSnapshot) => {
        if (!docSnapshot.exists) {
          Logging.log("login", "User " + result + " does not exist, creating new user");
          getDb().collection('users').doc(result).set({
            wishlists: {},
            shared_wishlists: {}
          });
        }
      });

      // Send token back to client
      firebase_auth.signInWithCustomToken(auth, customToken)
        .catch(function (error) {
          if (error) {
            Logging.handleError(error, res);
          }
        })
        .then(() => {
          Logging.log("login", req.user?.displayName + " (" + req.user?.id + ") Signed in with custom token on firebase");
          if (!res.headersSent) {
            res.redirect(req.session.prevPage);
          }
        })
    })
}

/** Logs out the user.
 * 
 * @param {Request} req
 * @param {Response} res
 */
function logout(req, res) {
  if (req.user) {
    let name = req.user.name
    let id = req.user.id
    req.logout(function (err) {
      if (err) {
        Logging.handleError(err, res);
      }
      if (!res.headersSent) {
        Logging.handleResponse(res, 200, null, "logout", "Logged out " + name + " (" + id + ")");
      }
    });
  } else {
    Logging.handleResponse(res, 401, null, "logout", "No user to log out");
  }
}

function getUser(req, res) {
  if (req.user) {
    Logging.handleResponse(res, 200, req.user, "getUser", "Got user " + req.user.name + " (" + req.user.id + ")");
  } else {
    Logging.handleResponse(res, 401, null, "getUser", "No user to get");
  }
}

exports.passport = passport;
exports.login = login;
exports.logout = logout;
exports.savePrevPageToSession = savePrevPageToSession;
exports.getUser = getUser;