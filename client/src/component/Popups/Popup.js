import React, { useCallback, useEffect, useState } from 'react';
import '../../styles/Popup.css';

function Popup(props) {

  const disablePopupEvent = useCallback((e) => {
    if (e.target.className === 'popup-blur' || e.key === 'Escape') {
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

  return (props.trigger) ? (
    <div className="popup">
      <div className='popup-blur' />
      <div className="popup-inner">
        <div className='popup-header'>
          <p className="popup-close" onClick={() => props.setTrigger(false)}>X</p>
        </div>
        {props.children}
      </div>
    </div>
  ) : null;
}

export default Popup;
