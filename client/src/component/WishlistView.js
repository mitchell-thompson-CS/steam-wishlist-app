import { Route, Routes } from "react-router-dom";
import WishlistSidebar from "./WishlistSidebar";
import Wishlists from "./Wishlists";
import WishlistInner from "./WishlistInner";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteWishlists, setWishlists } from "../actions/wishlistAction";
import { deleteUser, isUser } from "../actions/userAction";
import { setEvent, setLoading } from "../actions/eventAction";

const WishlistView = () => {
    const dispatch = useDispatch();
    const user = useSelector(state => state.userReducer.user);
    const wishlistItems = useSelector(state => state.wishlistReducer.wishlists);

    useEffect(() => {
        if (isUser(user) && (!wishlistItems || (Object.keys(wishlistItems).length === 0))) {
            console.log("fetching wishlists")
            dispatch(setLoading(true));
            fetch('/api/wishlists', { mode: 'cors', credentials: 'include' })
                .then(function (response) {
                    if (response.status === 200) {
                        return response.json();
                    } else if (response.status === 401) {
                        // if we got 401 that means they somehow got logged out
                        dispatch(deleteUser());
                        dispatch(setEvent(false, response.statusText));
                    } else if (response.status === 429) {
                        // if we got 429 that means they are being rate limited
                        dispatch(setEvent(false, response.statusText));
                    }
                }).then(function (data) {
                    if (data) {
                        dispatch(setWishlists(data));
                    }
                    dispatch(setLoading(false));
                })
        } else if (!isUser(user) && wishlistItems && Object.keys(wishlistItems).length > 0) {
            console.log("deleting wishlists")
            dispatch(deleteWishlists())
        }
    }, [wishlistItems, user, dispatch]);

    return (
        <div className="wishlistView">
            <WishlistSidebar />
            <Routes>
                <Route path="/" element={<Wishlists />} />
                <Route path="/:id" element={<WishlistInner />} />
            </Routes>
        </div>
    );
};

export default WishlistView;