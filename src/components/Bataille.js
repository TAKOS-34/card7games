import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from './App';
import socket from './socket';
import Chat from './Chat';
import FinPartie from './FinPartie';
import MessagePopUp from './MessagePopUp';
import '../styles/Bataille.css';
import { getElementError } from '@testing-library/react';
import Rules from './Rules';

function Bataille() {

    const [playersList, setPlayersList] = useState([]);
    const [cardReveal, setCardReveal] = useState([]);

    const [deck, setDeck] = useState([]);
    const [lenPioche,setLenPioche] = useState(0);
    const [isLeader, setLeader] = useState(false);

    const [isYourTurn, setIsYourTurn] = useState(false);
    const isYourTurnRef = useRef(isYourTurn);
    const [isBataille, setIsBataille] = useState(false);
    const [isEliminate, setIsEliminate] = useState(false);
    const isEliminateRef = useRef(isEliminate);

    const [hasPlayerAlreadyPlayed, setHasPlayerAlreadyPlayed] = useState(false);

    const [msg, setMsg] = useState(null);
    const [msgInfo, setMsgInfo] = useState(null);
    const { roomId } = useParams();
    const navigate = useNavigate();
    const divDeckRef = useRef(null);
    const divGameBatailleRef = useRef(null);
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
            socket.emit('initialisationBataille',roomId);
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
            let gameBoard = document.querySelector('.gameBoardBataille');
            if (gameBoard){
                gameBoard.remove();
                setGameEnded(true);
                setClassement(classement);
            }else{
                setMsg("Erreur dans l'affichage du classement")
            }
        });
        return () => { socket.off('gameOver'); }
    }, []);

    function leaveGame() {
        if(isEliminate) {
            const confirm = window.confirm(`Voulez-vous vraiment quitter la partie ?`);
            if(confirm) {
                socket.emit('leaveSocket');
                navigate('/');
            }
        } else if (isYourTurn && !isBataille && !hasPlayerAlreadyPlayed) {
            const confirm = window.confirm(`Voulez-vous vraiment quitter la partie ? \nSi vous quittez une partie en cours, vous serez sanctionné (-1 victoire)`);
            if(confirm) {
                socket.emit('leaveRoom', { roomId,'socketId':socket.id,id,pseudo,username });
                navigate('/');
            }
        } else {
            window.alert(`Vous ne pouvez pas quitter la partie avant d'avoir résolu la bataille ou si vous ou un autre joueur avez déjà joué une carte`);
        }
    }

    function handlePauseGame() {
        if(isYourTurn && !isBataille && !hasPlayerAlreadyPlayed) {
            const confirm = window.confirm(`Êtes-vous sûr de vouloir mettre la partie en pause ?`);
            if (confirm) {
                socket.emit('pauseGame',{ roomId,id });
                navigate('/');
            }
        } else {
            window.alert(`Vous ne pouvez pas mettre la partie en pause avant d'avoir résolu la bataille ou si vous ou un autre joueur avez déjà joué une carte`);
        }
    }

    // ----------------- JEU
    useEffect(() => {
        socket.on('initialisationBataille',(data) => {
            const joueur = data.find(j => j.id === id);
            if(joueur) {
                setDeck(joueur.cartes);
                setLenPioche(joueur.pioche.length);
                setIsYourTurn(true);
            }
            setPlayersList(data);
            const divGameBataille = divGameBatailleRef.current;
            if(divGameBataille){
                divGameBataille.innerHTML = "";
                data.forEach(index => {
                    const divElement = document.createElement('div');
                    divElement.id = index.id
                    //card
                    const squareElement = document.createElement('div');
                    //pseudo
                    const pseudoElement = document.createElement('p');
                    if(index.id == id){
                        pseudoElement.textContent = "Votre carte";
                    } else {
                        pseudoElement.textContent = index.pseudo;
                    }

                    divElement.appendChild(pseudoElement);
                    divElement.appendChild(squareElement);

                    divGameBataille.appendChild(divElement);
                });
            }
        });
        return () => { socket.off('initialisationBataille'); }
    }, []);

    useEffect(() => {
        socket.on('nouveauTourBataille', (data) => {
            data.players.forEach(id => {
                const parent = document.getElementById(id.id);
                let enfant;
                if (parent) {
                    enfant = parent.querySelector('div');
                }
                if (enfant) {
                    enfant.classList.remove("bataille");
                }
            })
            setMsgInfo(
                <p>
                    Nouveau tour, la personne ayant gagné le tour précédent est : {data.winner}
                </p>
            );
            if(!isEliminateRef.current){
                setMsg(null);
            }
            setCardReveal(data.playedIdCards);
            Array.from(divGameBatailleRef.current.children).forEach(div => {
                if (div.id == data.winnerId) {
                    const enfant = div.querySelector('div');
                    enfant.style.border = '0.2rem solid green';
                    setTimeout(() => {
                        enfant.style.border = '0.2rem solid black';
                    },3000);
                } else {
                    const enfant = div.querySelector('div');
                    enfant.style.border = '0.2rem solid red';
                    setTimeout(() => {
                        enfant.style.border = '0.2rem solid black';
                    },3000);
                }
            });
            setTimeout(() => {
                const joueur = data.players.find(j => j.id === id);
                if (joueur) {
                    setDeck(joueur.cartes);
                    setLenPioche(joueur.pioche.length);
                    setIsYourTurn(true);
                    setIsBataille(false);
                    setHasPlayerAlreadyPlayed(false);
                } else {
                    setDeck([]);
                }
                setPlayersList(data.players);
                if (divGameBatailleRef.current) {
                    divGameBatailleRef.current.querySelectorAll('div').forEach(div => {
                        const images = div.querySelectorAll('img');
                        images.forEach(img => {
                            img.remove();
                        });
                    });
                }
            }, 3000);
        });
        return () => { socket.off('nouveauTourBataille'); }
    }, []);

    useEffect(() => {
        socket.on('newCardPlayedBataille',(data) => {
            if(data.id !== id) {
                const parent = document.getElementById(data.id);
                let enfant;
                if (parent) {
                    enfant = parent.querySelector('div');
                }

                if (enfant) {
                    enfant.innerHTML="";
                }

                const imagePath = `/cartes/doscarte.png`;

                const cardElement = document.createElement('img');
                cardElement.setAttribute('src', imagePath);
                cardElement.setAttribute('alt', "dos de carte");

                if(enfant) {
                    enfant.appendChild(cardElement);
                }
                setHasPlayerAlreadyPlayed(true);
            }
        });
        return () => { socket.off('newCardPlayedBataille'); }
    }, []);

    useEffect(() => {
        socket.on('nouvelleBataille',(data) => {
            data.idList.forEach(id => {
                const parent = document.getElementById(id);
                if (parent) {
                    const enfant = parent.querySelector('div');
                    if (enfant) {
                        enfant.classList.add("bataille");
                    }
                }
            })
            setCardReveal(data.playedIdCards);
            if(data.idList.includes(id)){
                const joueur = data.players.find(j => j.id === id);
                if(joueur) {
                    let valeurCard = "";
                    console.log('test')
                    switch((data.idCardList[id].valeur)){
                        case 11 :
                            valeurCard = "Valet";
                            break;
                        case 12 :
                            valeurCard = "Reine";
                            break;
                        case 13 :
                            valeurCard = "Roi";
                            break;
                        case 14 :
                            valeurCard = "As";
                            break;
                        default :
                            valeurCard = data.idCardList[id].valeur;
                            break;
                    }
                    setDeck(joueur.cartes);
                    setLenPioche(joueur.pioche.length);
                    setIsBataille(true);
                    setMsgInfo(
                        <p>
                            Votre carte prise aléatoirement est : {valeurCard + " de " +data.idCardList[id].forme  }
                        </p>
                    );
                }
                setMsg(
                    <p>
                        Vous êtes en bataille avec {data.idList.length} joueurs : <br></br>
                        {data.pseudoList.map((pseudo, index) => (
                            <li key={index}>{pseudo}</li>
                        ))}
                    </p>
                );
                setTimeout(() => {
                    setIsYourTurn(true);
                },3000);
            } else {
                if(!isEliminateRef.current){
                    setMsg(
                        <p>
                            Une Bataille est en cours entre : <br></br>
                            {data.pseudoList.map((pseudo, index) => (
                                <li key={index}>{pseudo}</li>
                            ))}
                        </p>
                    );                    
                }
            }
            setTimeout(() => {
                divGameBatailleRef.current.querySelectorAll('div').forEach(div => {
                    const images = div.querySelectorAll('img');
                    images.forEach(img => {
                        img.remove();
                    });
                });
            },3000);
        });
        return () => { socket.off('nouvelleBataille'); }
    }, []); 

    useEffect(() => {
        socket.on('elimineBataille', (eliminatedPlayers) => {
            eliminatedPlayers.forEach(playerId => {
                const playerElement = document.getElementById(playerId);
                if (playerElement) {
                    playerElement.remove();
                }

                if(playerId === id) {
                    setIsEliminate(true);
                }
            });
    
            setPlayersList(prevPlayersList => prevPlayersList.filter(player => !eliminatedPlayers.includes(player.id)));
        });
    
        return () => { socket.off('elimineBataille'); };
    }, []);

    useEffect(() => {
        socket.on('messageBataille',(data) => {
            setMsgInfo(
                <p>
                    {data.message}
                </p>
            );
        });
        return () => { socket.off('messageBataille'); };
    }, []);

    const handleCardClick = (carte,index) => {
        if(isYourTurnRef.current) {
            socket.emit('sendCardBataille',{roomId,id,carte,pseudo});
            setIsYourTurn(false);
            document.getElementById(index).remove();

            const parent = document.getElementById(id);
            const enfant = parent.querySelector('div');
            enfant.innerHTML="";

            const imagePath = `/cartes/${carte.valeur.toString().toLowerCase()}_${carte.forme.toString().toLowerCase()}.svg`;

            const cardElement = document.createElement('img');
            cardElement.setAttribute('src', imagePath);
            cardElement.setAttribute('alt', "dos de carte");

            enfant.appendChild(cardElement);
        }
    }

    const renderDeck = () => {
        const divDeck =  divDeckRef.current;
        if(divDeck) {
            divDeck.innerHTML='';
            deck.forEach((carte,index) => {
                const imagePath = `/cartes/${carte.valeur.toString().toLowerCase()}_${carte.forme.toLowerCase()}.svg`;
                const delayAnimation=`${index*70}ms`
                const cardElement = document.createElement('img');
                cardElement.setAttribute('id', `c${index}`);
                cardElement.addEventListener('click', () => handleCardClick(carte, `c${index}`));
                cardElement.setAttribute('src', imagePath);
                cardElement.setAttribute('alt', `${carte.valeur} de ${carte.forme}`);
                cardElement.style.animationDelay = delayAnimation;
                divDeck.appendChild(cardElement);
            });
        }
    }

    const renderCardReveal = () => {
        const divGameBataille = divGameBatailleRef.current;
        if (divGameBataille) {
            cardReveal.forEach((data) => {
                const parent = document.getElementById(data[0]);
                if (parent) { // Ensure parent exists
                    const enfant = parent.querySelector('div');
                    if (enfant) { // Check if the 'div' child exists before proceeding
                        enfant.innerHTML = "";
                        const imagePath = `/cartes/${data[1].valeur.toString().toLowerCase()}_${data[1].forme.toLowerCase()}.svg`;
    
                        const cardElement = document.createElement('img');
                        cardElement.setAttribute('src', imagePath);
                        cardElement.setAttribute('alt', `${data[1].valeur} de ${data[1].forme}`);
    
                        enfant.appendChild(cardElement);
                    }
                }
            });
        }
    };

    useEffect(() => {
        isYourTurnRef.current = isYourTurn;
    }, [isYourTurn]);

    useEffect(() => {
        isEliminateRef.current = isEliminate;
        if(isEliminate){
            setMsg(<p>Vous êtes éliminé</p>);
        }
    }, [isEliminate]);

    useEffect(() => {
        renderDeck();
    }, [deck]);

    useEffect(() => {
        renderCardReveal();
    }, [cardReveal]);

    useEffect(() => {
        if (msgInfo != null) {
            setTimeout(() => {
                setMsgInfo(null);
            }, 3000);
        }
    }, [msgInfo]);

    const handleCloseRules = () => {
        setShowRules(false);
    }

    return (
        <>
            <div className='centerBox'>
                <div className='gameBoardBataille'>
                    <div className='gameBataille' ref={divGameBatailleRef}></div>
                    <div id="piocheBataille">
                        <img src="/cartes/doscarte.png"></img>
                        <p id="nbPioche" style={lenPioche>=10?{ transform: "translate(-20%, -33%)" } : { transform: "translate(-83%, -33%)" } }>{lenPioche}</p>
                    </div>
                    <div className='centerButton'>
                        <button id='leaveButton' onClick={leaveGame}>Quitter la partie</button>
                        {isLeader && (
                            <button id='pauseButton' onClick={handlePauseGame}>Mettre pause</button>
                        )}
                        <button id='rulesButton' onClick={() => setShowRules(true)}>Règles du jeu</button>
                    </div>
                    <div className='containerListPlayer'>
                        <h1>Listes des joueurs</h1>
                        <ul>
                            {playersList.map((player, index) => (
                                <li key={index}>{(player.pseudo === pseudo) ? '(Vous) ' : ''}{player.pseudo} - Cartes : {player.cartes.length + player.pioche.length}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="deck" ref={divDeckRef}></div>
                    <div className='containerChat'>
                        <Chat pseudo={pseudo} roomId={roomId} />
                    </div>
                    {msg !== null ? <MessagePopUp message={msg} ></MessagePopUp> : null}
                    {msgInfo ? <MessagePopUp message={msgInfo} idpop={"msgInfo"} ></MessagePopUp> : null}
                    {showRules && (
                        <Rules gameType="Bataille" onClose={handleCloseRules}/>
                    )}
                </div>
                {gameEnded && <FinPartie classement={classement} gameName={"Bataille"} id={id} pseudo={pseudo} />}
            </div>
        </>
    );
}

export default Bataille;