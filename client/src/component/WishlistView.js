import { Route, Routes } from "react-router-dom";
import WishlistSidebar from "./WishlistSidebar";
import Wishlist from "./wishlist";
import WishlistInner from "./wishlistInner";

const WishlistView = () => {

    return (
        <div className="wishlistView">
            <WishlistSidebar />
            <Routes>
                <Route path="/" element={<Wishlist />} />
                <Route path="/:id" element={<WishlistInner />} />
            </Routes>
        </div>
    );
};

export default WishlistView;