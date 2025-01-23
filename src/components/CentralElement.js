import React, { useContext,useState,useEffect } from 'react';
import { Link ,useNavigate} from 'react-router-dom';
import { AuthContext } from './App';
import '../styles/CentralElement.css';
import socket from './socket';
import MessagePopUp from './MessagePopUp';

function CentralElement() {
    const [msgInfo, setMsgInfo] = useState(null);

    const [listRoom, setListRoom] = useState([]);
    const [listRoomPause, setListRoomPause] = useState([]);
    const [roomId, setRoomId] = useState('');
    const [createRoomId, setCreateRoomId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectGame, setSelectGame] = useState('');
    const [sortGame, setSortGame] = useState('');
    const [nbPlayerRequired,setNbPlayerRequired] = useState(2);
    const navigate = useNavigate();
    const itemsPerPage = 12;

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
            getAllRoom();
            getPausedRooms();
        } else { 
            navigate('/'); 
        }
    }, [isLoggedIn]);

    function getAllRoom() {
        socket.emit('getAllRoom');
    }

    function getPausedRooms() {
        socket.emit('getPausedRooms',{'playerId':id});
    }

    useEffect(() => {
        socket.on('sendAllRoom', (roomList) => {
            const roomArray = Object.keys(roomList).map(key => ({
                key: key,
                roomId : roomList[key].roomId,
                gametype: roomList[key].gametype,
                gameName: roomList[key].gameName,
                nbPlayerRequired: roomList[key].nbPlayerRequired,
                nbActualPlayers: roomList[key].nbActualPlayers,
            }));
            setListRoom(roomArray);
        });
        return () => { socket.off('sendAllRoom'); }
    }, []);

    useEffect(() => {
        socket.on('sendPausedRooms', (data) => {
            if(data) {
                const roomPauseArray = data.map(item => ({
                    key: item.gameId,
                    roomId: item.gameId,
                    gametype: item.gametype,
                    gameName: item.gameName,
                    nbPlayerRequired: item.nbPlayerRequired,
                    nbActualPlayers: item.joueurs ? item.joueurs.length : 0, 
                }));
                setListRoomPause(roomPauseArray);
            }
        });
        return () => { socket.off('sendPausedRooms'); }
    }, []);

    function JoinRoom(room) {
        if (sortGame !== "pause") {
            socket.emit('joinRoom', { room, id, username, pseudo, "socketId": socket.id, 'rejoin': false, 'isBot':false});
        } else {
            const isRoomInPause = listRoomPause.find(item => item.roomId === room);
            if (isRoomInPause) {
                socket.emit('createRoom', {"createRoomId": room,id,username,pseudo,selectGame,nbPlayerRequired,"socketId": socket.id,"rejoin": true,'isBot':false});
            } else {
                setMsgInfo({'text':'Vous ne pouvez pas rejoindre la room en recréation car vous n\'étiez pas dedans','color':'red'});
            }
        }
    };

    const handleEnterPress = (event) => {
        if (event.key === 'Enter') {
            JoinRoom(roomId);
            setRoomId('');
        }
    };

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };

    const filteredList = sortGame == 0
    ? listRoom.filter((roomItem) =>
        roomItem.roomId.toLowerCase().includes(searchTerm.toLowerCase())
    ) : ( sortGame == "pause"
        ? listRoomPause
        :
        listRoom.filter((roomItem) =>
            roomItem.gametype === sortGame &&
            roomItem.roomId.toLowerCase().includes(searchTerm.toLowerCase())
        )
    )

    const numberOfPages = Math.ceil(filteredList.length / itemsPerPage);

    const getPageItems = (page) => {
        const startIndex = page * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredList.slice(startIndex, endIndex);
    };

    const handleCreateRoom = (event) => {
        event.preventDefault();
        if (!selectGame) {
            setMsgInfo({'text':'Veuillez sélectionner une option valide','color':'red'});
        }
        if (!createRoomId) {
            setMsgInfo({'text':'Veuillez génerer un ID valide','color':'red'});
        }
        else{
            socket.emit('createRoom',{createRoomId,id,username,pseudo,selectGame,nbPlayerRequired,"socketId":socket.id,"rejoin":false});
            setCreateRoomId('');
        }
    }

    const updateNbPlayerRequired = (e) => {
        setNbPlayerRequired(e.target.value);
    }

    function generateRandomId(length = 10) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        setCreateRoomId(result);
    }

    useEffect(() => {
        socket.on('messageCentralElementCreate',(data) => {
            setMsgInfo(data);
        });
        return () => {
            socket.off('messageCentralElementCreate');
        }
    }, []);
    
    useEffect(() => {
        socket.on('messageCentralElementJoin',(data) => {
            setMsgInfo(data);
        });
        return () => {
            socket.off('messageCentralElementJoin');
        }
    }, []);

    useEffect(() => {
        socket.on('roomJoined',(data) => {
            const roomId = data.roomId;
            navigate(`/room/${roomId}`);
        });
        return () => { socket.off('roomJoined'); }
    }, []);

    useEffect(() => {
        if (msgInfo != null) {
            setTimeout(() => {
                setMsgInfo(null);
            }, 5000);
        }
    }, [msgInfo]);

    return (
        <>
            {isLoggedIn ?(
                <>
                    <div className='centerBox'>
                        {msgInfo!=null?<MessagePopUp message={msgInfo.text} color={msgInfo.color} idpop="CentralElement"/>: null}
                        <div className='containerCreateRoom'>
                            <form onSubmit={handleCreateRoom}>
                                <h1>Créer une room</h1>
                                <div className='gridItem'>
                                    <input placeholder='Créer une room' value={createRoomId} onChange={(e) => setCreateRoomId(e.target.value) } readOnly id='createRoomInput'/>
                                </div>
                                <div className='gridItem'>
                                    <select value={selectGame} onChange={(e) => setSelectGame(e.target.value)} required id='ChooseGame'>
                                        <option value="">Sélectionnez un jeu</option>
                                        <option value="1">Bataille</option>
                                        <option value="2">Six Qui Prend</option>
                                        <option value="3">Uno</option>
                                    </select>
                                </div>
                                <div id='selectNbPlayers'>
                                    <p>Selectionner le nombre de joueurs</p>
                                    <input type="range" id="nbPlayerRequired" min="2" max="10" required value={nbPlayerRequired} onChange={updateNbPlayerRequired}/>
                                    <p>{nbPlayerRequired}</p>
                                </div>
                                <div className='gridItem6'>
                                    <button type='submit' id='createRoomButton'>Créer la room</button>
                                </div>
                                <div className='gridItem5'>
                                    <button onClick={() => generateRandomId()} id="GenerateIdButton" type='button'>Générer ID</button>
                                </div>
                            </form>

                        </div>

                        <div className='containerCenterElement'>
                            <h1>Rejoindre une room</h1>
                            <div className='centerInput'>
                                <select value={sortGame} onChange={(e) => setSortGame(e.target.value)} id='ChooseGame'>
                                    <option value="">Tout type de jeu</option>
                                    <option value="1">Bataille</option>
                                    <option value="2">Six Qui Prend</option>
                                    <option value="3">Uno</option>
                                    <option value="pause">Jeu en pause</option>
                                </select> 
                                <input placeholder='Rechercher une room' value={searchTerm} onChange={handleSearch} />
                                <input placeholder='Entrer via ID de la room' value={roomId} onChange={(e) => setRoomId(e.target.value)} onKeyDown={handleEnterPress} />
                            </div>
                            <div id='pageRoom'>
                                {Array.from({ length: numberOfPages }, (_, page) => (
                                    <ul key={page}>
                                        {getPageItems(page).map((roomItem, index) => (
                                            <li key={index} onClick={() => JoinRoom(roomItem.roomId)}>
                                                {sortGame === 'pause' ? `${roomItem.gameName} - ${roomItem.roomId}` : `${roomItem.gameName} - ${roomItem.roomId} - ${roomItem.nbActualPlayers}/${roomItem.nbPlayerRequired}`}
                                            </li>
                                        ))}
                                    </ul>
                                ))}
                            </div>
                        </div>
                    </div>    
                </>
            ):(
                <div className='centerBox'>              
                    <div className='containerCenterElementDisconnect'>
                        <h1>Bienvenue</h1>
                        <div className='textDisconnect'>
                            <p> 
                                Bonjour et bienvenue, vous devez possèder un compte pour jouer, veuillez vous connecter ou bien vous inscrire !
                                <br></br><br></br>
                                Si vous souhaitez vous connecter cliquez sur : <Link to="/connexion">Se connecter</Link>.
                                <br></br><br></br>
                                Si vous souhaitez vous inscrire cliquez sur : <Link to="/inscription">S'inscrire</Link>
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default CentralElement;