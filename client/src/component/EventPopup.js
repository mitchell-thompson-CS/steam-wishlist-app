import { useEffect } from 'react';
import '../styles/EventPopup.css'
import { useDispatch, useSelector } from 'react-redux';
import { resetEvent } from '../actions/eventAction';

const EventPopup = (props) => {
    const event = useSelector(state => state.eventReducer.event);
    const eventbody = useSelector(state => state.eventReducer.eventbody);
    const eventPositive = useSelector(state => state.eventReducer.eventPositive);
    const dispatch = useDispatch();

    useEffect(() => {
        if (props.trigger) {
            setTimeout(() => {
                dispatch(resetEvent());
            }, 3000);
        }
    }, [props.trigger, dispatch]);

    useEffect(() => {
        let doc = document.getElementById("errorpopup");
        if(doc !== null){
            if (eventPositive) {
                doc.style.backgroundColor = "green";
            } else {
                doc.style.backgroundColor = "red";
            }
        }
    }, [eventPositive, event]);

    return (props.trigger) ? (
        <div id="errorpopup">
            <h1>{eventbody}</h1>
        </div>
    ) : null;
}

export default EventPopup;