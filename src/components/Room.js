import '../styles/Room.css';
import React from 'react';
import { useContext,useState,useEffect } from 'react';
import { useNavigate,useParams } from 'react-router-dom';
import { AuthContext } from './App';
import Chat from './Chat';
import socket from './socket';
import MessagePopUp from './MessagePopUp';
import Rules from './Rules';

function Room() {

    const [players, setPlayers] = useState([]);
    const [nbPlayerRequired, setNbPlayersRequired] = useState('');
    const [nbActualPlayers, setNbActualPlayers] = useState('');
    const [isLeader, setLeader] = useState(false);
    const [gameName, setGameName] = useState('');
    const [botDifficulty, setBotDifficulty] = useState('Aleatoire');
    const [isRejoin, setIsRejoin] = useState(false);
    const [message, setMessage] = useState({ text: '', color: '' });
    const [roomIdCopied, setRoomIdCopied] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const { roomId } = useParams();
    const navigate = useNavigate();

    // ----------------- RECUPERATION INFORMATIONS JOUEUR
    const token = localStorage.getItem('accessToken');
    const { isLoggedIn } = useContext(AuthContext);
    let username, id, pseudo;
    if (token) {
        const base64Payload = token.split('.')[1];
        const decodedPayload = atob(base64Payload);
        const payload = JSON.parse(decodedPayload);
        username = payload.username;
        id = payload.id;
        pseudo = payload.pseudo;
    }
    useEffect(() => {
        if(isLoggedIn) {
            socket.emit('getRoomsInfos',roomId);
            socket.emit('updateListPlayers', roomId);
        } else { 
            navigate('/'); 
        }
    }, [isLoggedIn]);

    useEffect(() => {
        socket.on('sendRoomsInfos',(data) => {
            setLeader(data.leaderId === id);
            setGameName(data.gameName);
            setPlayers(data.pseudoList);
            setNbPlayersRequired(data.nbPlayerRequired);
            setNbActualPlayers(data.nbActualPlayers);
            setIsRejoin(data.isRejoin);
        });
        return () => { socket.off('sendRoomsInfos'); }
    }, []);

    useEffect(() => {
        socket.on('updateListPlayers',(data) => {
            setPlayers(data.pseudoList);
            setNbActualPlayers(data.nbActualPlayers);
        });
        return () => { socket.off('updateListPlayers'); }
    }, []);

    useEffect(() => {
        socket.on('leaderLeaveRoom',() => {
            socket.emit('leaveSocket',roomId);
            navigate('/');
        });
        return () => { socket.off('leaderLeaveRoom') }
    }, []);

    useEffect(() => {
        socket.on('messageGame',(data) => {
            setMessage(data);
            setTimeout(() => {setMessage('');},5000);
        });
        return () => { socket.off('messageGame'); }
    }, []);

    useEffect(() => {
        socket.on('startGame',(data) => {
            switch(data.gameType){
                case 1: navigate(`/bataille/${data.roomId}`);break;
                case 2: navigate(`/sixquiprend/${data.roomId}`);break;
                case 3: navigate(`/uno/${data.roomId}`);break;
                default:break;
            }
        });
        return () =>{ socket.off('startGame'); }
    }, []);

    const handleQuitGame = () => {
        const isConfirmed = window.confirm(`Êtes-vous sûr de vouloir quitter la partie ?`);
        if (isConfirmed) {
            socket.emit('leaveRoom',{roomId,'socketId':socket.id,id,pseudo,username});
            navigate('/');
        }
    }

    const handleStartGame = () => {
        socket.emit('startGame',{roomId,id,pseudo});
    }

    const copyText = () => {
        let roomIdText = document.getElementById('idRoomS').innerText;
        const textarea = document.createElement('textarea');
        textarea.value = roomIdText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        setRoomIdCopied(true);
        setTimeout(() => {setRoomIdCopied(false)}, 3000);
        document.body.removeChild(textarea);
        setRoomIdCopied(true);
        setTimeout(() => {setRoomIdCopied(false)},3000);
    }

    const handleCloseRules = () => {
        setShowRules(false);
    }

    const handleAddBot = () => {
        socket.emit('addBot', { id,roomId,botDifficulty });
    }

    const handleDeleteBot = () => {
        socket.emit('deleteBot', { id,roomId });
    }

    return (
        <>
            <div className='centerBox'>
                <div className='centerRoom'>
                    {roomIdCopied && (<MessagePopUp message="ID de la room copié dans le presse papiers"/>)}
                    {message.text && (<MessagePopUp message={message.text} color={message.color}/>)}
                    <div className='containerChat'>
                        <Chat pseudo={pseudo} roomId={roomId} />
                    </div>
                    <div className='idRoom'>
                        <p>{gameName} | ID de la room : <span id='idRoomS' onClick={copyText}>{roomId}</span> </p>
                    </div>
                    <div className='containerListPlayer'>
                        <div className='gridItem'>
                            <p id='listeJ'>Listes des joueurs ({nbActualPlayers}/{nbPlayerRequired})</p>
                            <ul>
                                {players.map((player,index) => (
                                    <li key={index}>• {player}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className='button'>
                        {isLeader && (
                            <><button onClick={handleStartGame}>Commencer la partie</button>
                            {!isRejoin && (
                                <><button onClick={handleAddBot}>Ajouter un bot</button>
                                <select value={botDifficulty} onChange={(e) => setBotDifficulty(e.target.value)} id='botDifficulty'>
                                {gameName === 'Bataille' && (
                                    <>
                                        <option value='Aleatoire'>Aleatoire</option>
                                    </>
                                )}
                                {gameName === 'Six Qui Prend' && (
                                    <>
                                        <option value='Aleatoire'>Aleatoire</option>
                                        <option value='Carte la plus forte'>Carte la plus forte</option>
                                        <option value='Carte la plus faible'>Carte la plus faible</option>
                                        <option value='NicoTech'>NicoTech</option>
                                        <option value='NicoTechV2'>NicoTechV2</option>
                                        <option value='BestChoice'>BestChoice</option>
                                    </>
                                )}
                                {gameName === 'Uno' && (
                                    <>
                                        <option value='Aleatoire'>Aleatoire</option>
                                    </>
                                )}
                                </select>
                                <button onClick={handleDeleteBot}>Retirer un bot</button>
                                </>
                            )}</>
                        )}
                        <button onClick={() => setShowRules(true)}>Règles du jeu</button>
                        <button onClick={handleQuitGame}>Quitter la partie</button>
                    </div>
                    {showRules && (
                        <Rules gameType={gameName} onClose={handleCloseRules}/>
                    )}
                </div>
            </div>
        </>
    )
};

export default Room;