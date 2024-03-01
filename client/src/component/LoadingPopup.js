import loadingImage from '../resources/rolling-loading.apng';
import '../styles/LoadingPopup.css';

const LoadingPopup = (props) => {

    return ( props.trigger ?
        <div id="loadingpopup">
            <img src={loadingImage} alt="Loading..." />
        </div>
        : null
    )
}

export default LoadingPopup;