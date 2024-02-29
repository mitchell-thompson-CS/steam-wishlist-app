import { Route, Routes } from "react-router-dom";
import WishlistSidebar from "./WishlistSidebar";
import Wishlists from "./Wishlists";
import WishlistInner from "./WishlistInner";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteWishlists, setWishlists } from "../actions/wishlistAction";
import { isUser } from "../actions/userAction";

const WishlistView = () => {
    const dispatch = useDispatch();
    const user = useSelector(state => state.userReducer.user);
    const wishlistItems = useSelector(state => state.wishlistReducer.wishlists);

    useEffect(() => {
        if (isUser(user) && (!wishlistItems || (Object.keys(wishlistItems).length === 0))) {
            console.log("fetching wishlists")
            fetch('/api/wishlists', { mode: 'cors', credentials: 'include' })
                .then(function (response) {
                    if (response.status === 200) {
                        return response.json();
                    }
                }).then(function (data) {
                    if (data) {
                        dispatch(setWishlists(data));
                    }
                })
        } else if (!isUser(user) && wishlistItems && Object.keys(wishlistItems).length > 0) {
            console.log("deleting wishlists")
            dispatch(deleteWishlists())
        }
    });

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