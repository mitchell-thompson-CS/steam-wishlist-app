import { useCallback, useEffect } from 'react';
import '../../styles/RenameWishlistPopup.css'
import { useDispatch } from 'react-redux';
import { setEvent, setLoading } from '../../actions/eventAction';
import { renameWishlist } from '../../actions/wishlistAction';
import axios from 'axios';

const RenameWishlistPopup = (props) => {
    const dispatch = useDispatch();

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

    function handleResponse(response) {
        try {
            if (response.status === 200) {
                dispatch(setEvent(true, "Operation Successful"));
                return true;
            } else {
                // if response is not 200 we are going to make an error appear for the user
                dispatch(setEvent(false, "Error " + response.status + ": " + response.statusText));
            }
        } catch (error) {
            // don't need to handle response here, just means that response put in is null
        }

        return false;
    }

    async function renameWishlistPost(id, name) {
        try {
            dispatch(setLoading(true));
            let res = await axios.post('/api/wishlist/rename', {
                wishlist_id: id,
                wishlist_name: name
            });
            // only on success we want to change the wishlist
            if (handleResponse(res)) {
                dispatch(renameWishlist(id, name));
                props.setTrigger(false);
            }
        } catch (error) {
            handleResponse(error.response)
            console.error(error);
        }
        dispatch(setLoading(false));
    }

    return (
        props.trigger ?
            <div id="renameWishlistPopup">
                <div id="renameWishlistBlur"></div>
                <div id="renameWishlistPopupContent">
                    <div className="renameWishlistTop">
                        <p id="renameWishlistClose" onClick={() => props.setTrigger(false)}>X</p>
                    </div>
                    <h2>Rename Wishlist</h2>
                    <div className="renameWishlist-section">
                        <input type="text" id="renameWishlistName"
                            placeholder={props.wishlist && props.wishlist.name ? props.wishlist.name : "Enter Wishlist Name"}
                            title={props.wishlist && props.wishlist.name ? props.wishlist.name : "Enter Wishlist Name"}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    let newName = document.getElementById('renameWishlistName').value;
                                    renameWishlistPost(props.id, newName);
                                }
                            }}
                        />
                        <button id="renameWishlistConfirm" onClick={
                            () => {
                                let newName = document.getElementById('renameWishlistName').value;
                                renameWishlistPost(props.id, newName);
                            }

                        }>Rename</button>
                    </div>
                </div>
            </div>
            : null
    )
}

export default RenameWishlistPopup;