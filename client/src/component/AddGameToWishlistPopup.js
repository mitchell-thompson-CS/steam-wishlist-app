import { useEffect } from "react";
import { useSelector } from "react-redux";
import '../styles/AddGameToWishlistPopup.css';

const AddGameToWishlistPopup = (props) => {
    const wishlistItems = useSelector(state => state.wishlistReducer.wishlists);

    useEffect(() => {

    }, [wishlistItems]);

    return (
        props.trigger ?
        <div className="addGameToWishlistPopup">
            <div className="addGameToWishlistPopupInner">
                <h1>Add Game To Wishlist</h1>
                <div className="addGameToWishlistPopupInnerContent">
                    <div className="addGameToWishlistEntries">
                        <h2>Owned</h2>
                        {wishlistItems.owned !== undefined ? 
                            Object.keys(wishlistItems.owned).map((key) => {
                                return (
                                    <div key={key} className="wishlistGamePopupWishlistName" id={key}>
                                        <h3>{wishlistItems.owned[key].name}</h3>
                                    </div>
                                )
                            })
                        : null}
                    </div>

                    <div className="addGameToWishlistEntries">
                        <h2>Shared</h2>
                        {wishlistItems.shared !== undefined ? 
                            Object.keys(wishlistItems.shared).map((key) => {
                                return (
                                    <div key={key} className="wishlistGamePopupWishlistName" id={key}>
                                        <h3>{wishlistItems.shared[key].name}</h3>
                                    </div>
                                )
                            })
                        : null}
                    </div>
                </div>
            </div>
        </div>
        : null
    )
}

export default AddGameToWishlistPopup;