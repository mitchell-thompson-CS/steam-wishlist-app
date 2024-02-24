import { Route, Routes } from "react-router-dom";
import WishlistSidebar from "./WishlistSidebar";
import Wishlists from "./Wishlists";
import WishlistInner from "./WishlistInner";

const WishlistView = () => {

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