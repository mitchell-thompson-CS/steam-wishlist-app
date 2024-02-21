const { getDb } = require('./firebase')
const { Logging, LogLevels } = require('./logging')
const FieldValue = require('firebase-admin').firestore.FieldValue;


/** Renames a wishlist in the firestore database and sends a 200 status code if successful
 * @params request object with a wishlist_name and wishlist_id in the body
 * @params response object
 */
async function renameWishlist(req, res) {
    let function_name = renameWishlist.name;
    let post = JSON.parse(JSON.stringify(req.body));
    var wishlist_name = post['wishlist_name'];
    var wishlist_id = post['wishlist_id'];
    if (!wishlist_name || !wishlist_id) {
        // wishlist name is empty
        Logging.handleResponse(res, 400, null, function_name,
            "Wishlist name is empty in request by " + req.user.id);
        return;
    }

    Logging.log(function_name,
        "Attempting to rename wishlist " + wishlist_id + " by " + req.user.id);

    try {
        let wishlistSnapshot = await getDb().collection('wishlists').doc(wishlist_id).get()
        if (!wishlistSnapshot.exists) {
            // wishlist doesn't exist
            Logging.handleResponse(res, 404, null, function_name,
                "Wishlist " + wishlist_id + " doesn't exist by user " + req.user.id);
            return;
        }
        let data = wishlistSnapshot.data();
        if (data.owner.id != req.user.id) {
            // user is not the owner or editor
            Logging.handleResponse(res, 403, null, function_name,
                "User " + req.user.id + " is not the owner of wishlist " + wishlist_id);
            return;
        }
        await getDb().collection('wishlists').doc(wishlist_id).update({
            name: wishlist_name
        }).then(() => {
            Logging.handleResponse(res, 200, null, function_name,
                "Wishlist " + wishlist_id + " renamed to " + wishlist_name + " by user " + req.user.id);
            return;
        });
    } catch (error) {
        Logging.handleResponse(res, 500, null, function_name,
            "Error renaming wishlist " + wishlist_id + " by user " + req.user.id + ": " + error);
        return;
    }
}

exports.renameWishlist = renameWishlist;