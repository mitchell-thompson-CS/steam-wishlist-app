import { useParams } from 'react-router-dom';
import '../styles/SearchForGamePopup.css';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchPopup } from '../actions/eventAction';

const SearchForGamePopup = (props) => {

    const dispatch = useDispatch();
    const searchPopup = useSelector(state => state.eventReducer.searchPopup);

    const closePopup = useCallback((e) => {
        if (e.target.className === "search-for-game-popup" || e.key === "Escape") {
            dispatch(setSearchPopup(false));
            document.removeEventListener('click', closePopup);
            document.removeEventListener('keydown', closePopup);
        }
    }, [dispatch])

    useEffect(() => {
        if(props.trigger) {
            document.addEventListener('click', closePopup);
            document.addEventListener('keydown', closePopup);
        } else {
            document.removeEventListener('click', closePopup);
            document.removeEventListener('keydown', closePopup);
        }
    }, [props.trigger, closePopup]);

    useEffect(() => {
        console.log(searchPopup);
    }, [searchPopup]);

    return (
        props.trigger ?
            <div className="search-for-game-popup">
                <div className="search-for-game-popup-inner">
                    <h1>Search for a game</h1>
                    <input type="text" placeholder="Enter a game name" />
                    <button>Search</button>
                </div>
            </div>
        : null
    );
}

export default SearchForGamePopup;