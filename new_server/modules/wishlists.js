const { getDb } = require('./firebase')
const { Logging, LogLevels } = require('./logging')
const { v4: uuidv4 } = require('uuid');

/** Gets a users owned and shared wishlists in a map and returns it
 * @params request object
 * @returns a map of the users wishlists
 */
async function getWishlistsHelper(user_id) {
    let function_name = "getWishlists";
    let final_wishlists = {};
    final_wishlists["owned"] = {};
    final_wishlists["shared"] = {};
    return await getDb().collection('users').doc(user_id).get().then(async (docSnapshot) => {
        if (!docSnapshot.exists) {
            Logging.log(function_name, "Issue getting user " + user_id + " from firestore", LogLevels.ERROR);
            return final_wishlists;
        }
        let db_wishlists = docSnapshot.data().wishlists;
        let db_shared_wishlists = docSnapshot.data().shared_wishlists;
        let combined_wishlists = [...Object.values(db_wishlists), ...Object.values(db_shared_wishlists)];
        if (!combined_wishlists.length > 0) {
            return final_wishlists;
        }

        try {
            // since we don't have any information about the wishlist reference we store in the user, we have to get the wishlists from firestore
            return await getDb().getAll(...combined_wishlists).then((wishlists) => {
                for (let wishlist of wishlists) {
                    if (wishlist.exists){
                        if (db_wishlists[wishlist.id]) {
                            final_wishlists["owned"][wishlist.id] = wishlist.data();
                        } else {
                            final_wishlists["shared"][wishlist.id] = wishlist.data();
                        }
                    }
                }
                return final_wishlists;
            })
        } catch (e) {
            Logging.log(function_name, "Issue getting wishlists from firestore: " + e, LogLevels.ERROR);
            return final_wishlists;
        }
    });
}

exports.exportedForTesting = {
    getWishlistsHelper: getWishlistsHelper,

}