import { useDispatch } from 'react-redux';
import '../../styles/WishlistGridHeader.css';
import { deleteWishlists } from '../../actions/wishlistAction';

const WishlistGridHeader = () => {
    const dispatch = useDispatch();

    function refreshWishlists() {
        dispatch(deleteWishlists());
    }

    return (
        <>
            <div id="wishlist-header">
                <div className="wishlist-header-left">
                    <h1>YOUR WISHLISTS</h1>
                </div>
            </div>

            <div id="wishlist-header-mini">
                <div className="reset-wishlist-button" onClick={refreshWishlists}>
                    <svg width="30px" height="30px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2,11V6A1,1,0,0,1,3,5H18.586L17.293,3.707a1,1,0,0,1,1.414-1.414l3,3A1,1,0,0,1,21,7H4v4a1,1,0,0,1-2,0Zm19,1a1,1,0,0,0-1,1v4H3a1,1,0,0,0-.707,1.707l3,3a1,1,0,1,0,1.414-1.414L5.414,19H21a1,1,0,0,0,1-1V13A1,1,0,0,0,21,12Z" /></svg>
                </div>
            </div>
        </>
    )
}

export default WishlistGridHeader;