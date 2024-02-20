const passport = require("passport");
const SteamStrategy = require("passport-steam");
const { admin, getDb } = require("./initFirebase");
const { Logging, LogLevels } = require("./logging");

require('dotenv').config({ path: __dirname + '/../../.env' });
const base_url = `${process.env.API_BASE_URL}`
console.log(base_url);

/** Checks if the user is logged in.
 * 
 * @param {Request} req
 * @param {Response} res
 * @param {*} next
 */
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    Logging.handleResponse(res, 401, null, "isLoggedIn", "Not logged in");
}

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

// this gets called whenever a user logs in
// stores only the information from the user that we find relevant (in this case id, name, and avatar)
passport.serializeUser(function (user, done) {
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
            // TODO: this
            profile.identifier = identifier;
            return done(null, profile);
        });
    }
));

/** Logs in the user and creates a custom token for them to use with firebase.
 * 
 * @param {Request} req
 * @param {Response} res
 */
async function login(req, res) {
    // TODO: test with disabling user accounts and see what happens? might be security issue there
    await getDb().collection('users').doc(req.user.id).get().then((docSnapshot) => {
        if (!docSnapshot.exists) {
            Logging.log("login", "User " + req.user.id + " does not exist, creating new user");
            getDb().collection('users').doc(req.user.id).set({
                wishlists: {},
                shared_wishlists: {}
            });
        }
    });

    res.redirect(req.session.prevPage);
}

/** Logs out the user.
 * 
 * @param {Request} req
 * @param {Response} res
 */
function logout(req, res) {
    let name = req.user.name
    let id = req.user.id
    req.logout(function (err) {
        if (err) {
            Logging.handleResponse(res, 500, null, "logout", "Error logging out " + name + " (" + id + "): " + err);
        }
        if (!res.headersSent) {
            Logging.handleResponse(res, 200, null, "logout", "Logged out " + name + " (" + id + ")");
        }
    });
}

function getUser(req, res) {
    Logging.handleResponse(res, 200, req.user, "getUser", "Got user " + req.user.name + " (" + req.user.id + ")");
}

exports.login = login;
exports.logout = logout;
exports.savePrevPageToSession = savePrevPageToSession;
exports.isLoggedIn = isLoggedIn;
exports.getUser = getUser;