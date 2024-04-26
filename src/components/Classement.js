import React, {useContext,useEffect,useState} from 'react'
import '../styles/Classement.css';
import { AuthContext } from './App';
import { useNavigate } from "react-router";
import socket from './socket';

function Classement() {

    const [listClassement, setListClassement] = useState([]);
    const [userClassement, setUserClassement] = useState([]);
    const navigate = useNavigate();

    // ----------------- RECUPERATION INFORMATIONS JOUEUR
    const token = localStorage.getItem('accessToken');
    const { isLoggedIn } = useContext(AuthContext);
    let username, userId, pseudo;
    if (token) {
        const base64Payload = token.split('.')[1];
        const decodedPayload = atob(base64Payload);
        const payload = JSON.parse(decodedPayload);
        username = payload.username;
        userId = payload.id;
        pseudo = payload.pseudo;
    }
    useEffect(() => {
        if(isLoggedIn) {
            orderByBataille();
        } else { 
            navigate('/'); 
        }
    }, [isLoggedIn]);

    const orderByBataille = () => {
        socket.emit('getClassement','bataille');
    }

    const orderBySix = () => {
        socket.emit('getClassement','sixQuiPrend');
    }

    const orderByUno = () => {
        socket.emit('getClassement','uno');
    }

    useEffect(() => {
        socket.on('seeClassement',(classement) => {
            setListClassement(classement);
            setUserClassement(listClassement.filter((player) => player.id === userId)[0]) 
        });
        return () => { socket.off('seeClassement'); }
    }, []);

    return (
        <>
            <div className='centerBox'>
                <div className="grid-container"> 
                    <div className='gridHeader'>
                        <h2>Classement</h2>
                        <div className='game1' onClick={orderByBataille}>Bataille</div>
                        <div className='game2' onClick={orderBySix}>Six Qui Prend</div>
                        <div className='game3' onClick={orderByUno}>Uno</div>
                    </div>
                    <div className='ClassementGrid'>
                        {listClassement.map((player, index) => (
                            <div key={index} className='Player'>
                            <p>{index + 1}.</p>
                            <p>{player.pseudo}</p>
                            <div className='game1'>{player.bataille}</div>
                            <div className='game2'>{player.sixQuiPrend} | (Moyenne: {player.moyenneSixQuiPrend})</div>
                            <div className='game3'>{player.uno} | (Moyenne: {player.moyenneUno})</div>
                            </div>
                        ))}
                    </div>
                    <div className='gridFooter'>
                        <p>{listClassement.findIndex((player) => player.id === userId) + 1}.</p>
                        <p>You ({pseudo})</p>
                        <div className='game1'>{userClassement ? userClassement.bataille : 0}</div>
                        <div className='game2'>{userClassement ? userClassement.sixQuiPrend : 0} | (Moyenne: {userClassement ? userClassement.moyenneSixQuiPrend : 0})</div>
                        <div className='game3'>{userClassement ? userClassement.uno : 0} | (Moyenne: {userClassement ? userClassement.moyenneUno : 0})</div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Classement