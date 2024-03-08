import { useCallback, useEffect } from 'react';
import '../styles/DeleteWishlistPopup.css'
import { useDispatch } from 'react-redux';
import { setEvent, setLoading } from '../actions/eventAction';
import { deleteWishlist, renameWishlist } from '../actions/wishlistAction';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DeleteWishlistPopup = (props) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const disablePopupEvent = useCallback((e) => {
        if (e.target.id === 'deleteWishlistBlur' || e.key === 'Escape') {
            props.setTrigger(false);
        }
        console.log(props);
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

    async function deleteWishlistPost(id) {
        try {
            dispatch(setLoading(true));
            let res = await axios.delete('/api/wishlist/delete', {
                data: {
                    wishlist_id: id
                }
            });
            if (handleResponse(res)) {
                props.disableGettingData.current = true;
                navigate("/wishlists");
                dispatch(deleteWishlist(id));
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
            <div id="deleteWishlistPopup">
                <div id="deleteWishlistBlur"></div>
                <div id="deleteWishlistPopupContent">
                    <div className="deleteWishlistTop">
                        <p id="deleteWishlistClose" onClick={() => props.setTrigger(false)}>X</p>
                    </div>
                    <h2>Delete this wishlist?</h2>
                    {props && props.wishlist && props.wishlist.name ?
                        <p title={props.wishlist.name}><i>{props.wishlist.name}</i></p> :
                        null
                    }
                    <div className="deleteWishlist-section" style={{marginBottom: 0}}>
                        <button id="deleteWishlistConfirm" onClick={
                            () => {
                                deleteWishlistPost(props.id);
                            }
                        }>Confirm</button>
                    </div>
                </div>
            </div>
            : null
    )
}

export default DeleteWishlistPopup;