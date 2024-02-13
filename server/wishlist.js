// var { admin } = require('./initFirebase');
// TODO: this only works with the below admin, the above admin doesn't work because of ArrayUnion. do we need to fix?
// also if its fine, we should probably rework app to make sure that initFirebase is run before everything
// i think its run somewhere before this right now and it works fine but not entirely properly i guess or guaranteed?
let admin = require('firebase-admin');
var { getGameData } = require('./game');
let { FirebaseError, UserError, handleError } = require('./errors');
const { v4: uuidv4 } = require('uuid');

// this function gets a users owned and shared wishlists in a map and returns it
// throws errors if user isn't logged in or if there's a problem getting the wishlists
// @params request object
async function getWishlists(req) {
    if (req.user) {
        return await admin.firestore().collection('users').doc(req.user.id).get().then(async (docSnapshot) => {
            if (docSnapshot.exists) {
                let db_wishlists = docSnapshot.data().wishlists;
                let db_shared_wishlists = docSnapshot.data().shared_wishlists;
                let combined_wishlists = [...Object.values(db_wishlists), ...Object.values(db_shared_wishlists)];
                if (combined_wishlists.length > 0) {
                    return await admin.firestore().getAll(...combined_wishlists).then((wishlists) => {
                        final_wishlists = {};
                        for (let wishlist of wishlists) {
                            final_wishlists[wishlist.id] = wishlist.data();
                        }
                        return final_wishlists;
                    })
                } else {
                    return {};
                }
            } else {
                throw new FirebaseError("Unable to get a user's wishlists");
            }
        });
    } else {
        throw new UserError("User is not logged in");
    }
}

// gets a users wishlists and sends them to the client
// sends the wishlists to the client as a JSON object
// @params request and response objects
async function getWishlistsPage(req, res) {
    try {
        let wishlists = await getWishlists(req);
        res.send(JSON.parse(JSON.stringify(wishlists)));
    } catch (error) {
        handleError(error, res);
    }

}

// creates a wishlist in the firestore database
// sends a 200 status code if successful
// @params request object with a wishlist_name in the body
// @params response object
function createWishlist(req, res) {
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

            if (wishlist_name) {
                // TODO: can we do this by setting a doc up here like below?
                // let doc = admin.firestore().collection('wishlists').doc(new_id);
                let wishdoc = admin.firestore().collection('wishlists').doc(new_id).get().then((wishsnapshot) => {
                    if (wishsnapshot.exists) {
                        console.log("wishlist already exists");
                    } else {
                        // wishlist doesn't exist, so we can go ahead and create it
                        admin.firestore().collection('wishlists').doc(new_id).set({
                            editors: {},
                            name: post['wishlist_name'],
                            games: {},
                            owner: admin.firestore().collection('users').doc(req.user.id)
                        }).then(() => {
                            try {
                                admin.firestore().collection('users').doc(req.user.id).update({
                                    [`wishlists.${new_id}`]: admin.firestore().collection('wishlists').doc(new_id)
                                }).then(() => {
                                    // wishlist added to user
                                    res.sendStatus(200);
                                });
                            } catch (error) {
                                // problem with user not existing now, so we need to delete the wishlist
                                try {
                                    admin.firestore().collection('wishlists').doc(new_id).delete();
                                } catch (error2) {
                                    // problem deleting the wishlist
                                    console.log("error deleting wishlist: " + error2);
                                }

                                handleError(error, res);
                            }
                        });
                    }
                })
            } else {
                // wishlist name is empty
                res.sendStatus(400);
            }
        });
    } else {
        // user isn't logged in
        res.sendStatus(401);
    }
}

// deletes a wishlist from the firestore database
// sends a 200 status code if successful
// @params request object with a wishlist_id in the body
// @params response object
function deleteWishlist(req, res) {
    if (req.user) {
        var body = '';
        req.on('data', function (data) {
            body += data;

            if (body.length > 1e6)
                req.socket.destroy();
        });

        req.on('end', function () {
            let post = JSON.parse(body);
            var wishlist_id = post['wishlist_id'];
            // TODO: add sanitization to the ids like this one that are inputted by user
            if (wishlist_id) {
                var wishlist = admin.firestore().collection('wishlists').doc(wishlist_id).get().then(async (wishsnapshot) => {
                    if (wishsnapshot.exists) {
                        let data = wishsnapshot.data();
                        // need to check permissions of user then can delete
                        if (data.owner.id == req.user.id) {
                            try {
                                // delete from user first, then will delete from editors
                                await admin.firestore().collection('users').doc(req.user.id).update({
                                    [`wishlists.${wishlist_id}`]: admin.firestore.FieldValue.delete()
                                }).then(async () => {
                                    for (let editor in data.editors) {
                                        try {
                                            await admin.firestore().collection('users').doc(editor).update({
                                                [`shared_wishlists.${wishlist_id}`]: admin.firestore.FieldValue.delete()
                                            });
                                        } catch (error2) {
                                            // editor doesn't exist
                                            console.log("error deleting shared wishlist from " + editor + ": " + error2);
                                        }
                                    }
                                });
                            } catch (error) {
                                // problem with user
                            }

                            // we will delete the wishlist regardless of if there was an error with the users
                            // if there was an error getting the users, they likely don't exist so wishlist shouldn't exist
                            try {
                                await admin.firestore().collection('wishlists').doc(wishlist_id).delete()
                                    .then(() => {
                                        res.sendStatus(200);
                                    });
                            } catch (error) {
                                // couldn't delete wishlist
                                handleError(error, res);
                            }
                        } else {
                            // user is not the owner
                            res.sendStatus(403);
                        }
                    } else {
                        // wishlist doesn't exist
                        res.sendStatus(404);
                    }
                })
            } else {
                // no wishlist id
                res.sendStatus(400);
            }
        })
    } else {
        // user isn't logged in
        res.sendStatus(401);
    }
}

// gets a wishlist from the firestore database and sends it to the client
// @params request object that has a parameter with id
// @params response object
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

// adds a game to a wishlist in the firestore database
// sends a 200 status code if successful
// @params request object with a game_id and wishlist_id in the body
// @params response object
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
                                if (gameData) {
                                    admin.firestore().collection('wishlists').doc(wishlist_id).update({
                                        [`games.${game_id}`]: gameData[game_id]['data']['name']
                                    }).then(() => {
                                        res.sendStatus(200);
                                    });
                                } else {
                                    // game doesn't exist
                                    res.sendStatus(400);
                                }
                            })
                        } else {
                            // user is not the owner or editor
                            res.sendStatus(403);
                        }
                    } else {
                        // wishlist doesn't exist
                        console.log(req.user.name + " tried to add a game to a wishlist that doesn't exist");
                        res.sendStatus(404);
                    }
                })
            } else {
                // no game id or wishlist id
                res.sendStatus(400);
            }
        });
    } else {
        // user isn't logged in
        res.sendStatus(401);
    }
}

// removes a game from a wishlist in the firestore database
// sends a 200 status code if successful
// @params request object with a game_id and wishlist_id in the body
// @params response object
function removeGameFromWishlist(req, res) {
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
            // TODO: add sanitization to the ids like this one that are inputted by user
            if (game_id && wishlist_id) {
                let wishdoc = admin.firestore().collection('wishlists').doc(wishlist_id).get().then((wishsnapshot) => {
                    if (wishsnapshot.exists) {
                        var data = wishsnapshot.data();

                        if (data.editors[req.user.id] || data.owner.id == req.user.id) {
                            admin.firestore().collection('wishlists').doc(wishlist_id).update({
                                [`games.${game_id}`]: admin.firestore.FieldValue.delete()
                            }).then(() => {
                                res.sendStatus(200);
                            });
                        } else {
                            // user is not the owner or editor
                            res.sendStatus(403);
                        }
                    } else {
                        // wishlist doesn't exist
                        res.sendStatus(404);
                    }
                });
            } else {
                // no game id or wishlist id
                res.sendStatus(400);
            }
        })
    } else {
        // user isn't logged in
        res.sendStatus(401);
    }
}

function addEditorToWishlist(req, res) {
    if (req.user) {
        var body = '';
        req.on('data', function (data) {
            body += data;

            if (body.length > 1e6)
                req.socket.destroy();
        });

        req.on('end', function () {
            var post = JSON.parse(body);
            var wishlist_id = post['wishlist_id'];
            var editor_id = post['editor_id'];
            if (wishlist_id && editor_id) {
                let wishdoc = admin.firestore().collection('wishlists').doc(wishlist_id).get().then(async (wishsnapshot) => {
                    if (wishsnapshot.exists) {
                        var data = wishsnapshot.data();
                        if (data.owner.id == req.user.id && !data.editors[editor_id]) {
                            try {
                                await admin.firestore().collection('users').doc(editor_id).update({
                                    [`shared_wishlists.${wishlist_id}`]: admin.firestore().collection('wishlists').doc(wishlist_id)
                                }).then(async () => {
                                    try {
                                        await admin.firestore().collection('wishlists').doc(wishlist_id).update({
                                            [`editors.${editor_id}`]: admin.firestore().collection('users').doc(editor_id)
                                        }).then(() => {
                                            res.sendStatus(200);
                                        });
                                    } catch (error) {
                                        // issue with adding shared wishlist to editor
                                        // TODO: this issue could either be a firebase issue or that the editor doesn't exist, we should handle both
                                        handleError(error, res);

                                        // have to attempt to remove the editor from the wishlist again
                                        try {
                                            admin.firestore().collection('users').doc(editor_id).update({
                                                [`shared_wishlists.${wishlist_id}`]: admin.firestore.FieldValue.delete()
                                            });
                                        } catch (error2) {
                                            // issue with removing editor from the wishlist
                                            console.log("error removing editor from wishlist after failing to add wishlist to editor:\n" + error2);
                                        }
                                    }
                                });
                            } catch (error) {
                                handleError(error, res);
                            }
                        } else {
                            if (data.owner.id != req.user.id) {
                                // user is not the owner
                                res.sendStatus(403);
                            } else {
                                // editor already exists
                                res.sendStatus(200);
                            }
                        }
                    } else {
                        // wishlist doesn't exist
                        res.sendStatus(404);
                    }
                })
            } else {
                // no wishlist id or editor id
                res.sendStatus(400);
            }
        });
    } else {
        // user isn't logged in
        res.sendStatus(401);
    }

}


exports.getWishlistPage = getWishlistPage;
exports.getWishlists = getWishlists;
exports.createWishlist = createWishlist;
exports.addGameToWishlist = addGameToWishlist;
exports.getWishlistsPage = getWishlistsPage;
exports.deleteWishlist = deleteWishlist;
exports.removeGameFromWishlist = removeGameFromWishlist;
exports.addEditorToWishlist = addEditorToWishlist;