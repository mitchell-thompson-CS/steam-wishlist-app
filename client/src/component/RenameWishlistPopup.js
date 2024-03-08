import { useCallback, useEffect } from 'react';
import '../styles/RenameWishlistPopup.css'

const RenameWishlistPopup = (props) => {

    const disablePopupEvent = useCallback((e) => {
        if (e.target.id === 'renameWishlistBlur' || e.key === 'Escape') {
            props.setTrigger(false);
        }
    }, [props]);

    useEffect(() => {
        if (!props.trigger) return;
        document.addEventListener('keyup', disablePopupEvent);
        document.addEventListener('click', disablePopupEvent);
        return () => {
            document.removeEventListener('click', disablePopupEvent);
            document.removeEventListener('keyup', disablePopupEvent);
        }
    }, [props, disablePopupEvent]);



    return (
        props.trigger ?
            <div id="renameWishlistPopup">
                <div id="renameWishlistBlur"></div>
                <div id="renameWishlistPopupContent">
                    <h2>Rename Wishlist</h2>
                    <div className="renameWishlist-section">
                        <input type="text" id="renameWishlistName" placeholder="Enter new wishlist name" />
                        <button id="renameWishlistConfirm">Rename</button>
                    </div>
                </div>
            </div>
            : null
    )
}

export default RenameWishlistPopup;