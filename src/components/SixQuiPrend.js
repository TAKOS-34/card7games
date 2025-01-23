import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from './App';
import FinPartie from './FinPartie';
import socket from './socket';
import Chat from './Chat';
import '../styles/SixQuiPrend.css';
import Rules from './Rules';
import MessagePopUp from './MessagePopUp';

function SixQuiPrend() {

    const [isLeader, setLeader] = useState(false);
    const [isYourTurn, setIsYourTurn] = useState(false);
    const isYourTurnRef = useRef(isYourTurn);

    const [needChooseLine, setNeedChoseLine] = useState(false);
    const needChooseLineRef = useRef(needChooseLine);

    const [playersWithCards, setPlayersWithCards] = useState([]);
    const [deck, setDeck] = useState([]);
    const [listeCarte,setListeCarte] = useState([]);
    const [seconds,setSeconds] = useState('');

    const [scoreLines, setScoreLines] = useState({});

    const [playersWhoPlayed, setPlayersWhoPlayed] = useState([]);
    const [hasPlayerAlreadyPlay, setHasPlayerAlreadyPlay] = useState(false);
    const [cartePrise, setCartePrise] = useState([]);
    const [showRules, setShowRules] = useState(false);
    const [gameEnded, setGameEnded] = useState(false);
    const [classement, setClassement] = useState({});
    const { roomId } = useParams();
    const navigate = useNavigate();

    const divDeckRef = useRef(null);
    const divCarteJoueRef = useRef(null);
    const divLigne1Ref= useRef(null);
    const divLigne2Ref= useRef(null);
    const divLigne3Ref= useRef(null);
    const divLigne4Ref= useRef(null);
    const gameBoardSixRef = useRef(null);

    const [msg, setMsg] = useState(null);
    const [msgInfo, setMsgInfo] = useState(null);
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
            socket.emit('initialisationSix',roomId);
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
        socket.on('leaderLeaveRoom',() => {
            socket.emit('leaveSocket',roomId);
            navigate('/');
        });
        return () => { socket.off('leaderLeaveRoom'); }
    }, []);

    useEffect(() => {
        socket.on('gameOver',(classement) => {
            socket.emit('leaveSocket',roomId);
            let gameBoardSix = document.querySelector('.gameBoardSix');
            if (gameBoardSix){
                gameBoardSix.remove();
                setGameEnded(true);
                setClassement(classement);
            }else{
                setMsg("Erreur dans l'affichage du classement")
            }
        });
        return () => { socket.off('gameOver'); }
    }, []);

    function leaveGame() {
        if (isYourTurnRef.current && !needChooseLine && !hasPlayerAlreadyPlay) {
            const confirm = window.confirm(`Voulez-vous vraiment quitter la partie ? \nSi vous quittez une partie en cours, vous serez sanctionné (-1 victoire)`);
            if(confirm) {
                socket.emit('leaveRoom', { roomId,'socketId':socket.id,id,pseudo,username });
                navigate('/');
            }
        } else {
            window.alert(`Vous ne pouvez pas mettre la partie en pause si vous avez jouer ou si quelqu'un à déjà jouer sa carte`);
        }
    }

    function handlePauseGame() {
        if (isYourTurnRef.current && !needChooseLine && !hasPlayerAlreadyPlay) {
            const confirm = window.confirm(`Êtes-vous sûr de vouloir mettre la partie en pause ?`);
            if (confirm) {
                socket.emit('pauseGame',{ roomId,id });
                navigate('/');
            }
        } else {
            window.alert(`Vous ne pouvez pas mettre la partie en pause si vous avez jouer ou si quelqu'un à déjà jouer sa carte`);
        }
    }

    // ----------------- JEU
    useEffect(() => {
        socket.on('initialisationSix', (data) => {
            const joueur = data.players.find(j => j.id === id);
            if (joueur) {
                setDeck(joueur.cartes);
                setPlayersWithCards(data.players);
                setListeCarte(data.lines);
                setCartePrise(data.cartePrise);
                setSeconds(30);
                setIsYourTurn(true);
            }
        });
        return () => { socket.off('initialisationSix'); }
    }, []);

    useEffect(() => {
        socket.on('nouveauTourSix', (data) => {
            setTimeout(() => {
                clearAllPlaces();
                setPlayersWhoPlayed([]);            
                const joueur = data.players.find(j => j.id === id);
                if (joueur) {
                    setDeck(joueur.cartes);
                    setPlayersWithCards(data.players);
                    setListeCarte(data.lines);
                    setCartePrise(data.cartePrise);
                    setSeconds(30);
                    setIsYourTurn(true);
                    setHasPlayerAlreadyPlay(false);
                }
                let divCarteJoue = divCarteJoueRef.current;
                if(divCarteJoue && divCarteJoue.hasChildNodes()){
                    divCarteJoue.innerHTML ='';
                }
            },4800+1500);
        });
        return () => { socket.off('initialisationSix'); }
    }, []);

    useEffect(() => {
        const handleNewCardPlayed = (data) => {
            if (data.id !== id && !playersWhoPlayed.includes(data.playerId)) {
                setPlayersWhoPlayed((prevPlayers) => [...prevPlayers, data.playerId]);
                const divCarteJoue = divCarteJoueRef.current;
                const nouvelleDiv = document.createElement('div');
                const pseudo = document.createElement('div');
                pseudo.classList.add("pseudoZindex");
                pseudo.textContent = data.pseudo;
                const nouvelleCarte = document.createElement('img');
                nouvelleDiv.classList.add("goCenter");
                const imagePath = `/cartes6/reverse.svg`;
                nouvelleCarte.src = imagePath;
                nouvelleDiv.appendChild(pseudo);
                nouvelleDiv.appendChild(nouvelleCarte);
                divCarteJoue.appendChild(nouvelleDiv);
            }
            setHasPlayerAlreadyPlay(true);
        };
        socket.on('newCardPlayedSix', handleNewCardPlayed);
        return () => { socket.off('newCardPlayedSix', handleNewCardPlayed); }
    }, []);

    useEffect(() => {
        socket.on('askLine',(data) => {
            if(data.id === id) {
                setMsg(
                    <p>Vous devez choisir une ligne</p>
                )
                setSeconds(20);
                setNeedChoseLine(true);
                const divLignesRefs = [divLigne1Ref, divLigne2Ref, divLigne3Ref, divLigne4Ref];
                divLignesRefs.forEach((_, indexLignes) => {
                    let divLigneRef = divLignesRefs[indexLignes];
                    let divLigne = divLigneRef.current;
                    const places = divLigne.querySelectorAll('div[id^="place"]');
                    places.forEach((emplacement,indexDelay) => {
                        const delayAnimation=`${indexDelay*150}ms`
                        emplacement.classList.add("animSelectLine");   
                        emplacement.style.animationDelay = delayAnimation;
                    });
                });
            } else {
                setMsgInfo(
                    <p>{data.pseudo} doit choisir une ligne</p>
                )
            }
        });
        return () => { socket.off('askLine'); }
    }, []);

    useEffect(() => {
        socket.on('revealedAllCards', (data) => {
            const divCarteJoue = divCarteJoueRef.current;
            let enfantsCarteJoue;
            if (divCarteJoue) {
                enfantsCarteJoue = Array.from(divCarteJoue.children);
                const divCarteContainer = divCarteJoue.querySelector('.card-container');
                if (divCarteContainer) {
                    const listeCard = divCarteContainer.querySelector('.card');
                    listeCard.classList.add('cardReverse');
                }
            }
            if (enfantsCarteJoue) {
                setTimeout(() => {
                    enfantsCarteJoue.forEach((enfant, index) => {
                        const delay = 150 * index;
                        setTimeout(() => {
                            enfant.classList.add('depop');
                            enfant.addEventListener('animationend', () => {
                                if (index === enfantsCarteJoue.length - 1) {
                                    enfantsCarteJoue.forEach((enfant) => {
                                        enfant.remove();
                                    });
                                    divCarteJoue.innerHTML = '';
                                    data.forEach((element) => {
                                        seeCard(element[1].valeur, element[2]);
                                    });
                                }
                            });
                            setTimeout(() => {
                                socket.emit('requestUpdateLines', roomId);
                            }, 1800);
                        }, delay);
                    });
                }, 1900);
            }
        });
    }, []);

    useEffect(() => {
        socket.on('messageSix',(data) => {
            if(data.id !== id) {
                setMsgInfo(
                    <p>
                        {data.message}
                    </p>
                );
            }
        });
        return () => { socket.off('messageSix'); };
    }, []);
    
    const handleCardClick = (carte,idCarte) => {
        if (isYourTurnRef.current){
            socket.emit('sendCardSix', { carte,id,roomId,pseudo });
            setIsYourTurn(false);
            deplacerElement(idCarte);
            setSeconds(0);
        }
    }

    const handleListClick = (listIndex) => {
        setMsg(null);
        if (needChooseLineRef.current) {
            setMsgInfo(
                <p>Vous avez choisi la ligne {listIndex}</p>
            )
            setSeconds('');
            socket.emit('sendChoosenLine',{'lineNumber':listIndex,roomId,id});
            setNeedChoseLine(false);
            const divLignesRefs = [divLigne1Ref, divLigne2Ref, divLigne3Ref, divLigne4Ref];

            divLignesRefs.forEach((_, indexLignes) => {

                let divLigneRef = divLignesRefs[indexLignes];
                let divLigne = divLigneRef.current;
                const places = divLigne.querySelectorAll('div[id^="place"]');
                places.forEach((emplacement) => {
                    emplacement.classList.remove("animSelectLine");   
                });
            });
        }
    }

    const deplacerElement = (id) => {
        if (isYourTurnRef.current) {
            const divDeck = divDeckRef.current;
            const divCarteJoue = divCarteJoueRef.current;
            let carte = divDeck.querySelector(`#${id}`);
            if (carte) {
                carte.classList.add("returnAnim");

                const pseudo = document.createElement('div');
                pseudo.classList.add('pseudoMaCarte');
                pseudo.textContent = "Ma carte";

                const nouvelleCarteContainer = document.createElement('div');
                nouvelleCarteContainer.classList.add('card-container');
                nouvelleCarteContainer.classList.add('goCenter');

                const nouvelleCarte = document.createElement('div');
                nouvelleCarte.classList.add('card');
                
                const frontFace = document.createElement('div');
                frontFace.classList.add('card-front');
                const frontImg = document.createElement('img');
                frontImg.src = carte.src;
                frontFace.appendChild(frontImg);

                const backFace = document.createElement('div');
                backFace.classList.add('card-back');
                const backImg = document.createElement('img');
                backImg.src = `/cartes6/reverse.svg`;
                backFace.appendChild(backImg);

                nouvelleCarteContainer.appendChild(pseudo);
                nouvelleCarte.appendChild(frontFace);
                nouvelleCarte.appendChild(backFace);
                nouvelleCarteContainer.appendChild(nouvelleCarte);

                carte.addEventListener('animationend', () => {
                    if (divDeck.contains(carte)) {
                        divDeck.removeChild(carte);
                        divCarteJoue.appendChild(nouvelleCarteContainer);
                    }
                });
            }
        }
    }

    const seeCard = (valueCard,pseudoList) => {
        const divCarteJoue = divCarteJoueRef.current;

        const pseudo = document.createElement('div');
        pseudo.classList.add("pseudoZindex");
        pseudo.textContent = pseudoList;

        const nouvelleCarteContainer = document.createElement('div');
        nouvelleCarteContainer.classList.add('card-container');

        const nouvelleCarte = document.createElement('div');
        nouvelleCarte.classList.add('card');

        const frontFace = document.createElement('div');
        frontFace.classList.add('card-front');
        const frontImg = document.createElement('img');
        frontImg.src = `/cartes6/reverse.svg`;
        frontFace.appendChild(frontImg);

        const backFace = document.createElement('div');
        backFace.classList.add('card-back');
        const backImg = document.createElement('img');
        backImg.src = `/cartes6/${valueCard}.svg`;
        backFace.appendChild(backImg);

        nouvelleCarte.appendChild(pseudo);
        nouvelleCarte.appendChild(frontFace);
        nouvelleCarte.appendChild(backFace);
        nouvelleCarteContainer.appendChild(nouvelleCarte);

        divCarteJoue.appendChild(nouvelleCarteContainer);
        nouvelleCarteContainer.addEventListener('animationend', () => {
            backFace.classList.add('card-backReturn');
        });
    }

    const renderDeck = () => {
        const divDeck = divDeckRef.current;
        if(divDeck){
            divDeck.innerHTML='';
            deck.forEach((carte,index) => {
                const imagePath= `/cartes6/${carte.valeur.toString().toLowerCase()}.svg`
                const delayAnimation=`${index*70}ms`
                const cardElement = document.createElement('img');
                cardElement.setAttribute('id', `c${index}`);
                cardElement.addEventListener('click', () => handleCardClick(carte, `c${index}`));
                cardElement.setAttribute('src', imagePath);
                cardElement.setAttribute('alt', `carte de ${carte.valeur}`);
                cardElement.style.animationDelay = delayAnimation;

                divDeck.appendChild(cardElement);
            });
        }
    }

    const divData = Array.from({ length: 6 }, (_, index) => index + 1);

    const clearAllPlaces = () => {
        const divLignesRefs = [divLigne1Ref, divLigne2Ref, divLigne3Ref, divLigne4Ref];
        divLignesRefs.forEach((ligneRef) => {
            const divLigne = ligneRef.current;
            if (divLigne) {
                const places = divLigne.querySelectorAll('div[id^="place"]');
                places.forEach((emplacement) => {
                    const image = emplacement.querySelector('img');
                    if (emplacement.id !== "place6") {
                        if(image){
                            image.remove();
                        }
                    }
                });
            }
        });
    }

    const handleSeeCardPrise = (id) => {
        if (gameBoardSixRef.current) {
            let divCardPrise = gameBoardSixRef.current.querySelector('.cardPrise');
            let divCard = gameBoardSixRef.current.querySelector('.boardCardPrise');
            divCardPrise.classList.add('Affiche');
            cartePrise[id].forEach(carte => {
                const imageElement = document.createElement("img");
                const imagePath = `/cartes6/${carte.valeur.toString().toLowerCase()}.svg`;
                imageElement.src = imagePath;
                divCard.appendChild(imageElement);
            });
        }
    }

    const removeCardPrise = () => {
        if (gameBoardSixRef.current) {
            let divCardPrise = gameBoardSixRef.current.querySelector('.cardPrise');
            let divCard = gameBoardSixRef.current.querySelector('.boardCardPrise');
            divCardPrise.classList.remove('Affiche');
            divCard.innerHTML = '';
        }
    }

    useEffect(() => {
        const divLignesRefs = [divLigne1Ref, divLigne2Ref, divLigne3Ref, divLigne4Ref];
        const values = Object.values(listeCarte);
        values.forEach((lignes, indexLignes) => {
            let divLigneRef = divLignesRefs[indexLignes];
            let divLigne = divLigneRef.current;
            lignes.forEach((element,index) => {
                let emplacement = divLigne.querySelector(`#place${index+1}`);
                if (emplacement) {
                    emplacement.innerHTML ='';
                    const imageElement = document.createElement("img");
                    const imagePath = `/cartes6/${element.valeur.toString().toLowerCase()}.svg`;
                    imageElement.src = imagePath;
                    emplacement.appendChild(imageElement);
                }
            });
        });
    }, [listeCarte]);

    useEffect(() => {
        renderDeck();
    }, [deck]);

    useEffect(() => {
        isYourTurnRef.current = isYourTurn;
    }, [isYourTurn]);

    useEffect(() => {
        needChooseLineRef.current = needChooseLine;
    }, [needChooseLine]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (needChooseLineRef.current && seconds === 0) {
                let nombreAleatoire = Math.floor(Math.random() * 4) + 1;
                handleListClick(nombreAleatoire);
            } else if (isYourTurnRef.current && seconds === 0) {
                const randomCardIndex = Math.floor(Math.random() * deck.length);
                const randomCard = deck[randomCardIndex];
                const randomCardId = `c${randomCardIndex}`;
                socket.emit('sendCardSix', { carte: randomCard, id, roomId, pseudo });
                deplacerElement(randomCardId);
                setSeconds('');
                setIsYourTurn(false);
            }else if(seconds <= 0){
                setSeconds('');
            }else {
                setSeconds(prevSeconds => prevSeconds - 1);
            }
        }, 1000);
    
        return () => clearInterval(interval);
    }, [seconds]);

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

    const seeScore = (index) => {
        if(listeCarte[index]){
            let score = 0;
            listeCarte[index].forEach(card => {
                score += card.nbBoeuf;
            });
            setScoreLines(prevState => ({
                ...prevState,
                [index]: score
            }));            
        }
    }

    const resetScore = (index) => {
        setScoreLines(prevState => ({
            ...prevState,
            [index]: null
        }));
    }
    return (
        <>
            <div className='centerBox'>
                <div className='gameBoardSix' ref={gameBoardSixRef}>
                    <div id='ligne1' className='ligne' ref={divLigne1Ref} onClick={() => needChooseLine ? handleListClick(1) : false} onMouseEnter={() =>seeScore(1)} onMouseLeave={()=>resetScore(1)}>
                        {divData.map((key) => (
                            key!==6? <div id={`place${key}`} key={key}></div>:<div id={`place6`} key={key}><p id="scoreSixQuiPrend">{scoreLines[1]}</p></div>
                        ))}
                    </div>
                    <div id='ligne2' className='ligne' ref={divLigne2Ref} onClick={() => needChooseLine ? handleListClick(2) : false} onMouseEnter={() =>seeScore(2)} onMouseLeave={()=>resetScore(2)}>
                        {divData.map((key) => (
                            key!==6? <div id={`place${key}`} key={key}></div>:<div id={`place6`} key={key}><p id="scoreSixQuiPrend">{scoreLines[2]}</p></div>
                        ))}
                    </div>
                    <div id='ligne3' className='ligne' ref={divLigne3Ref} onClick={() => needChooseLine ? handleListClick(3) : false} onMouseEnter={() =>seeScore(3)} onMouseLeave={()=>resetScore(3)}>
                        {divData.map((key) => (
                            key!==6? <div id={`place${key}`} key={key}></div>:<div id={`place6`} key={key}><p id="scoreSixQuiPrend">{scoreLines[3]}</p></div>
                        ))}
                    </div>
                    <div id='ligne4' className='ligne'ref={divLigne4Ref} onClick={() => needChooseLine ? handleListClick(4) : false} onMouseEnter={() =>seeScore(4)} onMouseLeave={()=>resetScore(4)}>
                        {divData.map((key) => (
                            key!==6? <div id={`place${key}`} key={key}></div>:<div id={`place6`} key={key}><p id="scoreSixQuiPrend">{scoreLines[4]}</p></div>
                        ))}
                    </div>
                    <div className='carteJoue' ref={divCarteJoueRef}>

                    </div>
                    <div className='centerButton'>
                        {isLeader && (
                            <button id='pauseButton' onClick={handlePauseGame}>Mettre pause</button>
                        )}
                        <button id='leaveButton' onClick={leaveGame}>Quitter la partie</button>

                        <button id='rulesButton' onClick={() => setShowRules(true)}>Règles du jeu</button>
                    </div>
                    <div className='containerListPlayer'>
                        <h1>Listes des joueurs</h1>
                        <ul>
                            {playersWithCards.map((player, index) => (
                                <li key={index}>
                                    <span id={`${player.id}`}>{player.id == id ? '(Vous) ' : ''}{player.pseudo} - Score : {player.score} - </span>
                                    <button onClick={() => handleSeeCardPrise(player.id)}>Details</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="deck" ref={divDeckRef}>

                    </div>
                    <div className='timer'>
                            {seconds}
                    </div>
                    <div className='containerChat'>
                        <Chat pseudo={pseudo} roomId={roomId} />
                    </div>

                    <div className='cardPrise'>
                        <div className='hamburger-btn' onClick={removeCardPrise}>
                            <div className="hamburger-line"></div>
                            <div className="hamburger-line"></div>
                        </div>
                        <div className='boardCardPrise'></div>
                    </div>

                    {showRules && (
                        <Rules gameType="Six Qui Prend" onClose={handleCloseRules}/>
                    )}
                    {msg !== null ? <MessagePopUp message={msg} ></MessagePopUp> : null}
                    {msgInfo ? <MessagePopUp message={msgInfo} idpop={"msgInfo"} ></MessagePopUp> : null}
                </div>
                {gameEnded && <FinPartie classement={classement} gameName={"Six Qui Prend"} id={id} pseudo={pseudo} />}
            </div>
        </>
    );
}

export default SixQuiPrend;