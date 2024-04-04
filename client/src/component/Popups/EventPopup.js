import { useEffect, useRef, useState } from 'react';
import '../../styles/EventPopup.css'
import { useDispatch, useSelector } from 'react-redux';
import { resetEvent } from '../../actions/eventAction';

const EventPopup = (props) => {
    const event = useSelector(state => state.eventReducer.event);
    const eventbody = useSelector(state => state.eventReducer.eventbody);
    const eventPositive = useSelector(state => state.eventReducer.eventPositive);
    const dispatch = useDispatch();
    const lastTimeout = useRef(null);
    const timeoutMs = 3000;

    function resetTimeout() {
        if (lastTimeout !== null && lastTimeout.current !== null) {
            clearTimeout(lastTimeout.current);
        }
    }

    function startTimeout() {
        lastTimeout.current = setTimeout(() => {
            lastTimeout.current = null;
            dispatch(resetEvent());
        }, timeoutMs);
    }

    // this useEffect triggers whenever any information about the event changes
    // if two of the same event happen it won't reset the timer though
    useEffect(() => {
        if (props.trigger) {
            let doc = document.getElementById("errorpopup");
            if (doc !== null) {
                // TODO: get this to fade away instead of just disappearing
            }

            // if there is already a timeout, clear it (something has changed)
            if (lastTimeout !== null && lastTimeout.current !== null) {
                clearTimeout(lastTimeout.current);
            }
            
            lastTimeout.current = setTimeout(() => {
                lastTimeout.current = null;
                dispatch(resetEvent());
            }, timeoutMs);
        }
    }, [props.trigger, dispatch, eventbody, eventPositive]);

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

    return ( props.trigger ?
        <div id="errorpopup" onMouseOver={resetTimeout} onMouseOut={startTimeout}>
            <h4>{eventbody}</h4>
        </div>
        : null
    )
}

export default EventPopup;