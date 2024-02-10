var { admin } = require('./initFirebase');
var { getGameData } = require('./game');


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
            }
        });
    } else {
        res.sendStatus(404);
    }
}

async function getWishlistsPage(req, res) {
    let wishlists = await getWishlists(req);
    res.send(JSON.stringify(wishlists));
}

function createWishlist(req, res) {
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
                        res.sendStatus(200);
                    });
                });
            }
        })
    });
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
                    res.sendStatus(401);
                }
            } else {
                console.log(req.user.name + " tried to access a wishlist that doesn't exist");
                res.sendStatus(404);
            }
        })
    } else {
        res.sendStatus(404);
    }
}

async function addGameToWishlist(req, res) {
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
                            // res.redirect('/wishlist/' + req.params.wishlist_id)
                            res.sendStatus(200);
                        });
                    })
                } else {
                    res.sendStatus(401);
                }
            } else {
                console.log(req.user.name + " tried to add a game to a wishlist that doesn't exist");
                res.sendStatus(404);
            }
        })
    } else {
        res.sendStatus(404);
    }
}
exports.getWishlistPage = getWishlistPage;
exports.getWishlists = getWishlists;
exports.createWishlist = createWishlist;
exports.addGameToWishlist = addGameToWishlist;
exports.getWishlistsPage = getWishlistsPage;