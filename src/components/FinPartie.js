import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/FinPartie.css';

function FinPartie(props) {

    const navigate = useNavigate();
    const classement = props.classement;
    const gameName = props.gameName;
    const id = props.id;
    const pseudo = props.pseudo;

    return (
        <>
            <div className='classementFin'>
                <div className='classementHeader'>
                    <h3 id='textClassement'>{gameName} | Classement final :</h3>
                    <div id='pseudo'>Pseudo</div>
                    <div id='score' >Score</div>
                </div>
                <div className='bodyClassement'>
                    {classement.map((player, index) => (
                        <div key={index} className='playerFin'>
                            <p>{index + 1}.</p>
                            <p>{player.pseudo}</p>
                            <p>{player.score}</p>
                        </div>
                    ))}
                </div>
                <div className='footerClassement'>
                    <p>{classement.findIndex(player => player.id === id)+1}.</p>
                    <p>{pseudo} (Vous)</p>
                    <p>{classement.find(player => player.id === id)?.score}</p>

                </div>
                <div className='buttonQuit'>
                    <button onClick={() => {navigate('/');}}>Revenir à  l'accueil</button>
                </div>
            </div>
        </>
    );
}

export default FinPartie;