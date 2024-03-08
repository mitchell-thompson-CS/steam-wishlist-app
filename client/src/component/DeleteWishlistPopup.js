import { useCallback, useEffect } from 'react';
import '../styles/RenameWishlistPopup.css'
import { useDispatch } from 'react-redux';
import { setEvent, setLoading } from '../actions/eventAction';
import { deleteWishlist, renameWishlist } from '../actions/wishlistAction';
import axios from 'axios';

const DeleteWishlistPopup = (props) => {
    const dispatch = useDispatch();

    const disablePopupEvent = useCallback((e) => {
        if (e.target.id === 'deleteWishlistBlur' || e.key === 'Escape') {
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
            if(response.status === 200){
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

    async function deleteWishlistPost(id) {
        try {
            dispatch(setLoading(true));
            let res = await axios.delete('/api/wishlist/delete', {
                data: {
                    wishlist_id: id
                }
            });
            if (handleResponse(res)) {
                dispatch(deleteWishlist(id));
            }
        } catch (error) {
            handleResponse(error.response)
            console.error(error);
        }
        dispatch(setLoading(false));
    
    }

    return (
        props.trigger ?
            <div id="deleteWishlistPopup">
                <div id="deleteWishlistBlur"></div>
                <div id="deleteWishlistPopupContent">
                    <div className="deleteWishlistTop">
                        <p id="deleteWishlistClose" onClick={() => props.setTrigger(false)}>X</p>
                    </div>
                    <h2>Rename Wishlist</h2>
                    <div className="deleteWishlist-section">
                        <input type="text" id="deleteWishlistName" placeholder="Enter new wishlist name" />
                        <button id="deleteWishlistConfirm" onClick={
                            () => {
                                let newName = document.getElementById('deleteWishlistName').value;
                                console.log(newName, props.id);
                                deleteWishlistPost(props.id, newName);
                            }
                        
                        }>Rename</button>
                    </div>
                </div>
            </div>
            : null
    )
}

export default DeleteWishlistPopup;