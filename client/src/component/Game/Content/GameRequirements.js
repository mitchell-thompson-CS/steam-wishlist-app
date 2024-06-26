import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { setLoading } from '../../../actions/eventAction';
import loadingImage from '../../../resources/rolling-loading.apng';

const GameRequirements = () => {
    const gameData = useSelector(state => state.gameReducer.games);
    let { id } = useParams();
    const [selectedPlatform, setSelectedPlatform] = useState('windows');
    const [anyPlatforms, setAnyPlatforms] = useState(false);

    // set the requirements for the selected platform
    useEffect(() => {
        if (anyPlatforms) {
            let platforms = gameData[id].platforms;
            if (selectedPlatform === 'windows' && platforms.windows === true) {
                let pc_requirements = gameData[id].pc_requirements;
                let minimum_requirements = "";
                let recommended_requirements = "";
                if (pc_requirements) {
                    minimum_requirements = pc_requirements.minimum;
                    recommended_requirements = pc_requirements.recommended;
                }
                let docMin = document.getElementById('minimum-requirements');
                if (minimum_requirements !== null && minimum_requirements !== undefined && minimum_requirements !== '') {
                    docMin.innerHTML = minimum_requirements;
                } else {
                    docMin.innerHTML = 'No minimum requirements';
                }

                let docRec = document.getElementById('recommended-requirements');
                if (recommended_requirements !== null && recommended_requirements !== undefined && recommended_requirements !== '') {
                    docRec.innerHTML = recommended_requirements;
                } else {
                    docRec.innerHTML = 'No recommended requirements';
                }
            }
            if (selectedPlatform === 'mac' && platforms.mac === true) {
                let mac_requirements = gameData[id].mac_requirements;
                let minimum_requirements = "";
                let recommended_requirements = "";
                if (mac_requirements) {
                    minimum_requirements = mac_requirements.minimum;
                    recommended_requirements = mac_requirements.recommended;
                }

                let docMin = document.getElementById('minimum-requirements');
                if (minimum_requirements !== null && minimum_requirements !== undefined && minimum_requirements !== '') {
                    docMin.innerHTML = minimum_requirements;
                } else {
                    docMin.innerHTML = 'No minimum requirements';
                }

                let docRec = document.getElementById('recommended-requirements');
                if (recommended_requirements !== null && recommended_requirements !== undefined && recommended_requirements !== '') {
                    docRec.innerHTML = recommended_requirements;
                } else {
                    docRec.innerHTML = 'No recommended requirements';
                }
            }
            if (selectedPlatform === 'linux' && platforms.linux === true) {
                let linux_requirements = gameData[id].linux_requirements;
                let minimum_requirements = "";
                let recommended_requirements = "";
                if (linux_requirements) {
                    minimum_requirements = linux_requirements.minimum;
                    recommended_requirements = linux_requirements.recommended;
                }

                let docMin = document.getElementById('minimum-requirements');
                if (minimum_requirements !== null && minimum_requirements !== undefined && minimum_requirements !== '') {
                    docMin.innerHTML = minimum_requirements;
                } else {
                    docMin.innerHTML = 'No minimum requirements';
                }

                let docRec = document.getElementById('recommended-requirements');
                if (recommended_requirements !== null && recommended_requirements !== undefined && recommended_requirements !== '') {
                    docRec.innerHTML = recommended_requirements;
                } else {
                    docRec.innerHTML = 'No recommended requirements';
                }
            }
        }
    }, [gameData, id, selectedPlatform, anyPlatforms]);

    // disable buttons for platforms that are not supported
    useEffect(() => {
        if (gameData && gameData[id] && gameData[id].platforms) {
            let platforms = gameData[id].platforms;
            if (platforms.windows === false) {
                setPlatformElementDisabled(document.getElementById('windows-req'));
            }
            if (platforms.mac === false) {
                setPlatformElementDisabled(document.getElementById('mac-req'));
            }
            if (platforms.linux === false) {
                setPlatformElementDisabled(document.getElementById('linux-req'));
            }
        }
    }, [gameData, id]);

    // select the platform button for the selected platform
    useEffect(() => {
        if (gameData && gameData[id] && gameData[id].platforms) {
            let platforms = gameData[id].platforms;
            // deselect all ones that are valid
            if ((selectedPlatform === 'windows' && platforms.windows === true) ||
                (selectedPlatform === 'mac' && platforms.mac === true) ||
                (selectedPlatform === 'linux' && platforms.linux === true)) {
                let windowsReq = document.getElementById('windows-req');
                let macReq = document.getElementById('mac-req');
                let linuxReq = document.getElementById('linux-req');
                if (platforms.windows === true) {
                    deselectPlatformElement(windowsReq);
                }
                if (platforms.mac === true) {
                    deselectPlatformElement(macReq);
                }
                if (platforms.linux === true) {
                    deselectPlatformElement(linuxReq);
                }

                // select whatever is now selected
                if (selectedPlatform === 'windows') {
                    selectPlatformElement(windowsReq);
                } else if (selectedPlatform === 'mac') {
                    selectPlatformElement(macReq);
                } else if (selectedPlatform === 'linux') {
                    selectPlatformElement(linuxReq);
                }
            }
        }
    }, [selectedPlatform, gameData, id]);

    useEffect(() => {
        if (gameData[id] && gameData[id].cache && gameData[id].platforms && anyPlatforms === false) {
            for (let p of Object.values(gameData[id].platforms)) {
                if (p === true) {
                    setAnyPlatforms(true);
                    break;
                }
            }
        }
    }, [gameData, id, anyPlatforms])

    function setPlatformElementDisabled(element) {
        try {
            if (element) {
                element.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
                element.style.cursor = 'not-allowed';
                element.style.hover = 'not-allowed';
                element.style.boxShadow = 'none';
            }
        } catch (e) {
            console.log(e);
        }
    }

    function selectPlatformElement(element) {
        try {
            if (element) {
                element.style.backgroundColor = 'grey';
                element.style.boxShadow = '0 0 10px 5px rgba(0, 0, 0, 0.2)';
            }
        } catch (e) {
            console.log(e);
        }
    }

    function deselectPlatformElement(element) {
        try {
            if (element) {
                element.style.backgroundColor = '';
                element.style.boxShadow = '';
            }
        } catch (e) {
            console.log(e);
        }
    }

    function selectReqPlatform(e) {
        let platform = e.currentTarget.id;
        if (platform === 'windows-req') {
            setSelectedPlatform('windows');
        } else if (platform === 'mac-req') {
            setSelectedPlatform('mac');
        } else if (platform === 'linux-req') {
            setSelectedPlatform('linux');
        }
    }

    return (
            <div className="game-content-section">
                <div className="game-content-section-header">
                    <h2>Game Requirements</h2>
                </div>
                {gameData[id] && (anyPlatforms || gameData[id].cache) ?
                    <div className="game-content-section-body">
                        <div id="game-requirements-selector">
                            <div className="platform-selector" id='windows-req' onClick={selectReqPlatform}>
                                <h3>Windows</h3>
                            </div>
                            <div className="platform-selector" id='mac-req' onClick={selectReqPlatform}>
                                <h3>Mac</h3>
                            </div>
                            <div className="platform-selector" id='linux-req' onClick={selectReqPlatform}>
                                <h3>Linux</h3>
                            </div>
                            <div className="clear"></div>
                        </div>

                        <div id="game-requirements">
                            <div id="minimum-requirements">
                            </div>
                            <div id="recommended-requirements">
                            </div>
                            <div className="clear"></div>
                        </div>
                    </div>
                    : 
                    <div className='centerLoading'>
                        <img src={loadingImage} alt="loading..." /> 
                    </div>
                }
            </div>
    )
}

export default GameRequirements;