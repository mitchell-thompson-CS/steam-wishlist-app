import { Route, Routes } from "react-router-dom";
import WishlistSidebar from "./WishlistSidebar";
import Wishlists from "./Wishlists";
import WishlistInner from "./WishlistInner";
import "../styles/WishlistView.css";

const WishlistView = () => {
    return (
        <div className="wishlistView">
            <WishlistSidebar />
            <div id="wishlistMainContent">
                <Routes>
                    <Route path="/" element={<Wishlists />} />
                    <Route path="/:id" element={<WishlistInner />} />
                </Routes>
            </div>
        </div>
    );
};

export default WishlistView;