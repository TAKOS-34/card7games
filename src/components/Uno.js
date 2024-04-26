import React, { useContext,useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from './App';
import socket from './socket';
import Chat from './Chat';
import FinPartie from './FinPartie';
import '../styles/Uno.css';
import MessagePopUp from './MessagePopUp';
import Rules from './Rules';

function Uno() {

    const [isLeader, setLeader] = useState(false);
    const [playersList, setPlayersList] = useState([]);
    const [pseudoToPlay, setPseudoToPlay] = useState('');
    const [nextToPlay, setNextToPlay] = useState('');
    const [deck, setDeck] = useState([]);
    const [talon, setTalon] = useState({});
    const [isYourTurn, setIsYourTurn] = useState(false);
    const [needChooseColor, setNeedChooseColor] = useState(false);
    const [needChoosePioche, setNeedChoosePioche] = useState(false);
    const [msgColor, setMsgColor] = useState(null);
    const [msg, setMsg] = useState(null);
    const [msgInfo, setMsgInfo] = useState(null);
    const { roomId } = useParams();
    const navigate = useNavigate();
    const divDeckRef = useRef(null);
    const divTalonRef = useRef(null);
    const [showRules, setShowRules] = useState(false);
    const [gameEnded, setGameEnded] = useState(false);
    const [classement, setClassement] = useState({});

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
            socket.emit('initialisationUno',roomId);
            socket.emit('isLeader',{roomId,id});
        } else { 
            navigate('/'); 
        }
    }, [isLoggedIn]);

    // ----------------- GESTION SORTIE DES JOUEURS ET INITIALISATION DE LA PARTIE
    useEffect(() => {
        socket.on('isLeader',(data) => {
            setLeader(data);
        })
        return () => { socket.off('isLeader'); }
    }, []);

    useEffect(() => {
        socket.on('leaderLeaveRoom', () => {
            socket.emit('leaveSocket',roomId);
            navigate('/');
        });
        return () => { socket.off('leaderLeaveRoom'); }
    }, []);

    useEffect(() => {
        socket.on('gameOver',(classement) => {
            socket.emit('leaveSocket',roomId);
            let gameBoardUno = document.querySelector('.gameBoardUno');
            if (gameBoardUno){
                gameBoardUno.remove();
                setGameEnded(true);
                setClassement(classement);
            }else{
                setMsg("Erreur dans l'affichage du classement")
            }
        });
        return () => { socket.off('gameOver'); }
    }, []);

    function leaveGame() {
        if (isYourTurn && !needChooseColor) {
            const confirm = window.confirm(`Voulez-vous vraiment quitter la partie ? \nSi vous quittez une partie en cours, vous serez sanctionné (-1 victoire)`);
            if(confirm) {
                socket.emit('leaveRoom', { roomId,'socketId':socket.id,id,pseudo,username });
                navigate('/');
            }
        } else {
            window.alert(`Vous ne pouvez pas quitter la partie si ce n'est pas votre tour ou si vous devez choisir une couleur`);
        }
    }

    function handlePauseGame() {
        if (isYourTurn && !needChooseColor) {
            const confirm = window.confirm(`Êtes-vous sûr de vouloir mettre la partie en pause ?`);
            if(confirm) {
                socket.emit('pauseGame',{ roomId,id });
                navigate('/');
            }
        } else {
            window.alert(`Vous ne pouvez pas mettre la partie en pause si ce n'est pas votre tour ou si vous devez choisir une couleur`);
        }
    }

    // ----------------- JEU
    useEffect(() => {
        socket.on('nouveauTourUno',(data) => {
            setPlayersList(data.players);
            setPseudoToPlay(data.pseudo);
            setNextToPlay(data.nextPlayer);
            setTalon(data.talon);
            let color,type;
            switch (data.talon.couleur) { case 'rouge':color = 'red';break;case 'bleu':color = 'blue';break;case 'vert':color = 'green';break;case 'jaune':color = 'yellow';break;default:color = '';break; }
            switch (data.talon.type) { case 'numero': type = `de numéro ${data.talon.valeur}`;break;case 'plusDeux': type = 'un +2';break;case 'reverse': type = 'un changer de sens';break;case 'interdit': type = 'un interdit de jouer';break;case 'plusQuatre': type = 'un joker / +4';break;case 'joker': type = 'un joker / +4';break;default:type = '';break; }
            const joueur = data.players.find(j => j.id === id);
            if (joueur) {
                setDeck(joueur.cartes);
            }
            if(data.id === id) {
                setIsYourTurn(true);
                setMsg(
                    <p>
                        C'est à votre tour de jouer | Jouer une carte de couleur <span style={{ color: color }}>{data.talon.couleur}</span>{type && (<span> ou {type}</span> )}
                    </p>
                );
            } else {
                setMsg(
                    <p>
                        C'est au tour de {data.pseudo} de jouer
                    </p>
                );
            }
        });
        return () => { socket.off('nouveauTourUno'); };
    }, []);

    useEffect(() => {
        socket.on('contestPlusQuatre',(data) => {
            if(data.id === id) {
                const ChooseContest = (answer) => {
                    let a = (answer == "oui" ? true : false);
                    socket.emit('contestPlusQuatre',{roomId,a});
                }
                setMsg(
                    <p>
                        {data.oldIndex} viens de jouer un +4 <br></br>
                        Souhaitez vous contester ce +4 ? <br></br>
                        <div className='buttonMsg'>
                            <a id="pioche" onClick={() => ChooseContest("oui")}>Oui</a>
                            <a id="jouer" onClick={() => ChooseContest("non")}>Non</a>
                        </div>
                    </p>
                );
            } else {
                setMsg(
                    <p>
                        {data.pseudo} décide ou non de contester le +4
                    </p>
                );
            }
        });
        return () => { socket.off('contestPlusQuatre'); };
    }, []);

    useEffect(() => {
        socket.on('pioche',(data) => {
            if(data.id === id) {
                const ChoosePioche = (answer) => {
                    let a = (answer == "piocher" ? true : false);
                    socket.emit('pioche',{ roomId,a,'carte':data.carte });
                    setNeedChoosePioche(false);
                    setMsg(null);
                }
                setNeedChoosePioche(true);
                const imagePath = (data.carte.couleur == null ? `/cartes_uno/${data.carte.type}.svg` : (data.carte.valeur == null ? `/cartes_uno/${data.carte.type}_${data.carte.couleur}.svg` : `/cartes_uno/${data.carte.valeur}_${data.carte.couleur}.svg`));
                setMsg(
                    <p>
                        Vous venez de piocher une carte directement jouable, la voici : <br></br>
                        <img src={imagePath}></img>
                        <br></br>
                        Voulez-vous la piocher ou la jouer directement ?
                        <br></br>
                        <div className='buttonMsg'>
                            <a id='pioche' onClick={() => ChoosePioche("piocher")}>Piocher</a>
                            <a id='jouer' onClick={() => ChoosePioche("jouer")}>Jouer</a>                            
                        </div>

                    </p>
                );
            }
        });
        return () => { socket.off('pioche'); };
    }, []);

    useEffect(() => {
        socket.on('joueePioche',(card) => {
            if((card.type === "joker" || card.type === "plusQuatre")){
                setNeedChooseColor(true);
                const ChooseColor = (couleur) => {
                    socket.emit('sendCardUno', { card, roomId, id, couleur });
                    setNeedChooseColor(false);
                    setMsgColor(null);
                }
                setMsgColor(
                    <p>
                        Veuillez choisir une couleur :
                        <div className='buttonMsg'>
                            <a id="rouge"onClick={() => ChooseColor("rouge")}>rouge</a> 
                            <a id="jaune" onClick={() => ChooseColor("jaune")}>jaune</a>
                            <a id="vert" onClick={() => ChooseColor("vert")}>vert</a>
                            <a id="bleu" onClick={() => ChooseColor("bleu")}>bleu</a>
                        </div>
                    </p>
                );
            } else{
                socket.emit('sendCardUno', { card, roomId, id });
            }
        });
        return () => { socket.off('joueePioche'); };
    }, []);

    useEffect(() => {
        socket.on('messageUno',(data) => {
            setMsgInfo(
                <p>
                    {data.message}
                </p>
            );
        });
        return () => { socket.off('messageUno'); };
    }, []);

    const handleCardClick = (card,index) => {
        if(isYourTurn && (card.type === "joker" || card.type === "plusQuatre")){
            setNeedChooseColor(true);
            setIsYourTurn(false);
            const ChooseColor = (couleur) => {
                socket.emit('sendCardUno', { card, roomId, id, couleur });
                setNeedChooseColor(false);
                setMsgColor(null);
            }
            setMsgColor(
                <p>
                    Veuillez choisir votre Couleur entre : 
                    <div className='buttonMsg'>
                        <a id="rouge"onClick={() => ChooseColor("rouge")}>rouge</a> 
                        <a id="jaune" onClick={() => ChooseColor("jaune")}>jaune</a>
                        <a id="vert" onClick={() => ChooseColor("vert")}>vert</a>
                        <a id="bleu" onClick={() => ChooseColor("bleu")}>bleu</a>
                    </div>
                </p>
            );
            if(index) {
                document.getElementById(index).remove();
            }

        } else if(isYourTurn && ((((card.couleur === talon.couleur || card.valeur === talon.valeur) && ((card.couleur === talon.couleur) ? true : card.type === talon.type))) || (card.type === "joker" || card.type === "plusQuatre"))) {
            setIsYourTurn(false);
            socket.emit('sendCardUno', { card, roomId, id });
            if(index) {
                document.getElementById(index).remove();
            }
        } else {
            setMsgInfo(`Ce n'est pas votre tour`);
        }
    }

    const pioche = () => {
        let card = {type : 'pioche', valeur : null, couleur : null};
        socket.emit('sendCardUno', { card, roomId, id });
        setIsYourTurn(false);
    }

    const renderTalon = () => {
        const divTalon = divTalonRef.current;
        if(Object.keys(talon).length > 0){
            if(divTalonRef){
                divTalon.innerHTML="";
                divTalonRef.innerHTML='';
                let imagePath = ''
                if(talon.type == "joker"){
                    imagePath=`/cartes_uno/joker.svg`
                }
                else if(talon.type == "plusQuatre"){
                    imagePath=`/cartes_uno/plusQuatre.svg`
                }
                else{
                    imagePath=`/cartes_uno/${talon.valeur == null ? talon.type.toString() : talon.valeur.toString().toLowerCase()}_${talon.couleur.toString().toLowerCase()}.svg`
                }
                const cardElement = document.createElement('img');
                cardElement.setAttribute('src', imagePath);
                divTalon.appendChild(cardElement);

                const card = divTalon.firstElementChild;
                switch (talon.couleur) {
                    case "bleu":
                        card.style.animation = "bleu 2000ms ease-out infinite";
                        break;
                    case "jaune":
                        card.style.animation = "jaune 2000ms ease-out infinite";
                        break;
                    case "vert":
                        card.style.animation = "vert 2000ms ease-out infinite";
                        break;
                    case "rouge":
                        card.style.animation = "rouge 2000ms ease-out infinite";
                        break;
                    default:
                        break;
                }
                card.style.borderRadius= "1.4rem";
            }
        }
    }

    const renderDeck = () => {
        const divDeck = divDeckRef.current;
        if(divDeck){
            divDeck.innerHTML='';
            deck.forEach((carte,index) => {
                let imagePath = ''
                if(carte.type == "joker"){
                    imagePath=`/cartes_uno/joker.svg`
                } else if(carte.type == "plusQuatre"){
                    imagePath=`/cartes_uno/plusQuatre.svg`
                } else {
                    imagePath=`/cartes_uno/${carte.valeur == null ? carte.type.toString() : carte.valeur.toString().toLowerCase()}_${carte.couleur.toString().toLowerCase()}.svg`
                }
                const delayAnimation=`${index*70}ms`
                const cardElement = document.createElement('img');
                cardElement.setAttribute('id', `c${index}`);
                cardElement.setAttribute('src', imagePath);
                cardElement.setAttribute('alt', `carte de ${carte.valeur}`);
                cardElement.style.animationDelay = delayAnimation;
                if(isYourTurn && !msgColor && !needChoosePioche && ((((carte.couleur === talon.couleur || carte.valeur === talon.valeur) && ((carte.couleur === talon.couleur) ? true : carte.type === talon.type))) || (carte.type === "joker" || carte.type === "plusQuatre"))){
                    cardElement.addEventListener('click', () => handleCardClick(carte, `c${index}`));
                    cardElement.classList.add("jouable");
                }
                divDeck.appendChild(cardElement);
            });
        }
    };

    useEffect(() => {
        renderDeck();
    }, [deck]);

    useEffect(() => {
        renderTalon();
    }, [talon]);

    useEffect(() => {
        if (msgInfo != null) {
            setTimeout(() => {
                setMsgInfo(null);
            }, 5000);
        }
    }, [msgInfo]);

    useEffect(() => {
        if (needChoosePioche) {
            renderDeck();
        }
    }, [needChoosePioche]);

    useEffect(() => {
        if (msgColor) {
            renderDeck();
        }
    }, [msgColor]);

    const handleCloseRules = () => {
        setShowRules(false);
    }

    return (
        <>
            <div className='centerBox'>
                <div className='gameBoardUno'>
                    <div className='containerListPlayer'>
                        <h1>Listes des joueurs</h1>
                        <ul>
                            {playersList.map((player, index) => (
                                <li key={index}>
                                    <span id={`${player.id}`}>
                                        {player.pseudo === pseudoToPlay ? '> ' : ''} 
                                        {player.pseudo === nextToPlay && (
                                            <span style={{ opacity: 0.5 }}>Suivant : </span>
                                        )} 
                                        {player.id == id ? '(Vous) ' : ''}
                                        {player.pseudo} - Cartes : {player.cartes.length} - Score : {player.score}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className='Uno'>
                        <div className='talon' ref={divTalonRef}>

                        </div>
                        <img src="/cartes_uno/dos.png" className='pioche' onClick={isYourTurn && !needChooseColor ? pioche : null} style={{ display: isYourTurn && !needChooseColor ? 'block' : 'none' }}>
                            
                        </img>
                    </div>

                    <div className="deck" ref={divDeckRef}></div>

                    <div className='centerButton'>
                        {isLeader && (
                            <button id='pauseButton' onClick={handlePauseGame} >Mettre pause</button>
                        )}
                        <button id='leaveButton' onClick={leaveGame}>Quitter la partie</button>
                        <button id='rulesButton' onClick={() => setShowRules(true)}>Règles du jeu</button>
                    </div>

                    <div className='containerChat'>
                        <Chat pseudo={pseudo} roomId={roomId} />
                    </div>

                    {needChooseColor?<MessagePopUp message={msgColor} ></MessagePopUp> : null}
                    {needChooseColor||(msg==null)? null : <MessagePopUp message={msg}></MessagePopUp>}
                    
                    {msgInfo ? <MessagePopUp message={msgInfo} idpop={"msgInfo"} ></MessagePopUp> : null}

                    {showRules && (
                        <Rules gameType="Uno" onClose={handleCloseRules}/>
                    )}
                </div>
                {gameEnded && <FinPartie classement={classement} gameName={"Uno"} id={id} pseudo={pseudo} />}
            </div>
        </>
    );
}

export default Uno;