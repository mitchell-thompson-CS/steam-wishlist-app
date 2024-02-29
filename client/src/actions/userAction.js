import { SET_USER, DELETE_USER } from "../actionTypes/actionTypes";

const setUser = (inputId, inputName, inputAvatar) => {
    return {
        type: SET_USER,
        payload: {
            id: inputId,
            name: inputName,
            avatar: inputAvatar,
        }
    };
};

const deleteUser = () => {
    return {
        type: DELETE_USER,
    };
};

export { setUser, deleteUser };