import React from 'react';
import '../styles/Rules.css';
import passeTour from '../assets/interdit_bleu.png';
import inversion from '../assets/reverse_jaune.png';
import plusQuatre from '../assets/plusQuatre.png';
import plusDeux from '../assets/plusdeux_vert.png';
import joker from '../assets/joker.png';

const Rules = ({ gameType, onClose }) => {

    return (
        <div className='regles'>
            <div className='hamburger-btn' onClick={onClose}>
                <div className="hamburger-line"></div>
                <div className="hamburger-line"></div>
            </div>
            <h1>Règles du jeu | {gameType}</h1>
            <div className='rules_board'>
            {gameType === 'Bataille' && (
                <>
                    <h2>Comment jouer</h2>
                    <ol>
                        <li>• Le jeu se joue avec un jeu de cartes standard de 52 cartes</li><br></br>
                        <li>• Les cartes sont distribuées équitablement entre tous les joueurs, et elles ne sont pas visibles par les autres</li><br></br>
                        <li>• Les joueurs choisissent ensuite une carte chacun et la retournent simultanément</li><br></br>
                        <li>• La carte la plus élevée remporte la bataille et le gagnant place toutes les cartes jouées dans sa pioche</li><br></br>
                        <li>• En cas d'égalité entre les cartes les plus fortes, une "bataille" est déclenchée</li><br></br>
                        <li>• Une carte est tirée aléatoirement de la main de chaque joueur impliqué dans la bataille</li><br></br>
                        <li>• Les joueurs en bataille doivent choisir une nouvelle carte, et ce cycle continue jusqu'à ce qu'il y ait un vainqueur</li><br></br>
                        <li>• Le gagnant prend toutes les cartes jouées lors de ce tour et les place dans sa pioche</li><br></br>
                        <li>• Si un joueur n'a plus de cartes dans sa main, il reçoit les cartes de sa pioche. S'il n'a plus de cartes ni dans sa main ni dans sa pioche, il est éliminé</li><br></br>
                    </ol>
                    <h2>Fin de la partie</h2>
                    <p>Le jeu se termine lorsqu'un joueur possède toutes les cartes du jeu. Ce joueur est alors déclaré vainqueur de la Bataille</p>
                </>
            )}
            {gameType === 'Six Qui Prend' && (
                <>
                    <h2>Préparation</h2>
                    <p>Le jeu se joue avec 104 cartes numérotées de 1 à 104. Chaque carte affiche un nombre de têtes de bœuf qui représente les points de pénalité. Les joueurs reçoivent 10 cartes chacun, et 4 cartes sont placées face visible pour former les débuts de 4 rangées de cartes</p>
                    <br></br>
                    <h2>Comment jouer</h2>
                    <ol>
                        <li>• À chaque tour, les joueurs choisissent secrètement une de leurs cartes, puis les révèlent simultanément</li><br></br>
                        <li>• Les cartes sont ajoutées aux rangées en ordre croissant. Une carte doit être placée à côté de la dernière carte d'une rangée qui porte un numéro immédiatement inférieur à celui de la carte jouée</li><br></br>
                        <li>• Si un joueur ne peut pas placer sa carte légalement, il doit prendre une rangée entière de son choix comme points de pénalité et la remplacer par sa carte</li><br></br>
                        <li>• Si la carte jouée est la sixième d'une rangée, le joueur prend les cinq premières cartes comme points de pénalité et place sa carte comme nouvelle première carte de la rangée</li><br></br>
                    </ol>
                    <h2>Fin de la partie</h2>
                    <p>Le jeu se termine quand un joueur atteint 66 têtes de bœuf. Le joueur avec le moins de points de pénalité est déclaré vainqueur. En cas d'égalité, il y a plusieurs gagnants</p>
                </>
            )}
            {gameType === 'Uno' && (
                <>
                    <h2>Comment jouer</h2>
                    <ol>
                        <li>• Chaque joueur reçoit 7 cartes. Le reste des cartes forme la pioche</li><br></br>
                        <li>• La première carte de la pioche est retournée sur le talon, si c'est une carte action, alors son effet est appliqué</li><br></br>
                        <li>• Les joueurs peuvent jouer une carte sur le talon seulement si elle est de la même couleur, ou bien du même numéro / symbol.</li><br></br>
                        <li>• Si un joueur ne peut pas jouer de carte, il doit piocher une carte</li><br></br>
                        <li>• Si la carte qui vient d'être pioché est jouable, le joueur peut choisir de la jouer directement ou bien de la garder dans sa main</li><br></br>
                        <li>• Si le joueur qui vous précède joue un +4, vous pouvez ou non le contester. Si vous ne le contestez pas, alors vous acceptez le +4 et passez votre tour. Si vous le contestez, deux scénarios sont possibles. Soit le joueur précédent avait la possibilité de jouer une autre carte, si c'est le cas alors il prend le +4 à votre place et vous ne passez pas votre tour. Sinon, vous prenez +6 cartes et vous passez votre tour</li><br></br>
                    </ol>
                    <h2>Cartes d'action</h2>
                    <ol>
                        <li><strong>Passe ton tour :</strong> Le tour du joueur suivant est sauté <img src={passeTour} alt="Passe tour" style={{width:"5%", height:"5%"}}/></li><br></br>
                        <li><strong>Inversion :</strong> Change le sens du jeu <img src={inversion} style={{width:"5%", height:"5%"}}/></li><br></br>
                        <li><strong>+2 :</strong> Le joueur suivant doit piocher 2 cartes et passer son tour <img src={plusDeux} style={{width:"5%", height:"5%"}}/></li><br></br>
                        <li><strong>Joker :</strong> Le joueur peut choisir la couleur à jouer <img src={joker}style={{width:"5%", height:"5%"}} /></li><br></br>
                        <li><strong>+4 :</strong> Le joueur suivant doit piocher 4 cartes (sauf s'il conteste) et le joueur choisit la couleur à continuer <img src={plusQuatre} style={{width:"5%", height:"5%"}}/></li>
                    </ol>
                    <br></br>
                    <h2>Fin de la partie</h2>
                    <p>Lorsqu'un joueur ne possède plus de carte, alors il est ajouté à son score le cumul des points des cartes de ses adversaires, soit 20 points par carte action ou bien le numéro de la carte. La partie se termine lorsqu'un joueur a atteint 500 points. Si le gagnant n'a pas encore atteint 500 points, alors une manche est relancée</p>
                </>
            )}
            </div>
        </div>
    );
};

export default Rules;