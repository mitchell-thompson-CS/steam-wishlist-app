// var { admin } = require('./initFirebase');
// TODO: this only works with the below admin, the above admin doesn't work because of ArrayUnion. do we need to fix?
// also if its fine, we should probably rework app to make sure that initFirebase is run before everything
// i think its run somewhere before this right now and it works fine but not entirely properly i guess or guaranteed?
let admin = require('firebase-admin');
var { getGameData } = require('./game');
let { FirebaseError, UserError, handleError } = require('./errors');
const { v4: uuidv4 } = require('uuid');

// this function gets a users wishlists in an array and returns it
// returns null if the user is not logged in
async function getWishlists(req) {
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
                        for (var wishlist of wishlists) {
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
            } else {
                // console.log("Unable to get a user's wishlists");
                throw new FirebaseError("Unable to get a user's wishlists");
            }
        });
    } else {
        throw new UserError("User is not logged in");
    }
}

async function getWishlistsPage(req, res) {
    try {
        let wishlists = await getWishlists(req);
        res.send(JSON.parse(JSON.stringify(wishlists)));
    } catch (error) {
        handleError(error, res);
    }

}

function createWishlist(req, res) {
    // console.log(req);
    if (req.user) {
        var body = '';
        req.on('data', function (data) {
            body += data;

            if (body.length > 1e6)
                req.socket.destroy();
        });

        req.on('end', function () {
            let post = JSON.parse(body);
            var wishlist_name = post['wishlist_name'];
            console.log('creating a new wishlist: ' + wishlist_name);
            var new_id = uuidv4();

            // console.log('id: ' + new_id);
            // console.log('user: ' + req.session.passport.user.id);
            if (wishlist_name) {
                let wishdoc = admin.firestore().collection('wishlists').doc(new_id).get().then((wishsnapshot) => {
                    if (wishsnapshot.exists) {
                        console.log("wishlist already exists");
                    } else {
                        // TODO: why do we use req.session.passport.user.id instead of req.user.id?
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
                                res.sendStatus(200);
                            });
                        });
                    }
                })
            } else {
                res.sendStatus(400);
            }
        });
    } else {
        res.sendStatus(401);
    }
}

async function getWishlistPage(req, res) {
    if (req.user) {
        var wishlist = await admin.firestore().collection('wishlists').doc(req.params.id).get().then((wishsnapshot) => {
            if (wishsnapshot.exists) {
                var data = wishsnapshot.data();
                data['id'] = req.params.id;
                if (data.editors[req.user.id] || data.owner.id == req.user.id) {
                    // res.render('wishlist', { user: req.user, wishlist: data });
                    res.send(data);
                } else {
                    res.sendStatus(403);
                }
            } else {
                console.log(req.user.name + " tried to access a wishlist that doesn't exist");
                res.sendStatus(404);
            }
        })
    } else {
        res.sendStatus(401);
    }
}

function addGameToWishlist(req, res) {
    if (req.user) {
        var body = '';
        req.on('data', function (data) {
            body += data;

            if (body.length > 1e6)
                req.socket.destroy();
        });

        req.on('end', function () {
            var post = JSON.parse(body);
            var game_id = post['game_id'];
            var wishlist_id = post['wishlist_id'];
            if (game_id && wishlist_id) {
                let wishdoc = admin.firestore().collection('wishlists').doc(wishlist_id).get().then((wishsnapshot) => {
                    if (wishsnapshot.exists) {
                        var data = wishsnapshot.data();

                        if (data.editors[req.user.id] || data.owner.id == req.user.id) {
                            getGameData(game_id).then((gameData) => {
                                if(gameData){
                                    admin.firestore().collection('wishlists').doc(wishlist_id).update({
                                        [`games.${game_id}`]: gameData[game_id]['data']['name']
                                    }).then(() => {
                                        res.sendStatus(200);
                                    });
                                } else {
                                    res.sendStatus(400);
                                }
                            })
                        } else {
                            res.sendStatus(403);
                        }
                    } else {
                        console.log(req.user.name + " tried to add a game to a wishlist that doesn't exist");
                        res.sendStatus(404);
                    }
                })
            } else {
                res.sendStatus(400);
            }
        });
    } else {
        res.sendStatus(401);
    }
}
exports.getWishlistPage = getWishlistPage;
exports.getWishlists = getWishlists;
exports.createWishlist = createWishlist;
exports.addGameToWishlist = addGameToWishlist;
exports.getWishlistsPage = getWishlistsPage;