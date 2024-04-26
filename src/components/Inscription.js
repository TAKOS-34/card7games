import { useEffect, useState,useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './App';
import '../styles/ConnexionInscription.css';
import socket from './socket';

function Inscription() {

    const [username, setUsername] = useState('');
    const [pseudo, setPseudo] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setpasswordConfirm] = useState('');
    const [message, setMessage] = useState({ text: '', color: '' });
    const { isLoggedIn } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if(isLoggedIn) {
            navigate('/');
        }
    }, [isLoggedIn]);

    useEffect(() => {
        socket.on('messageInscription',(data) => {
            setMessage(data);
            setTimeout(() => {setMessage('');},5000);
        });
        return () => { socket.off('messageInscription'); }
    }, []);

    useEffect(() => {
        socket.on('inscriptionReussie',() => {setTimeout(() => navigate('/connexion'), 2000);});
        return () => { socket.off('inscriptionReussie'); };
    }, []);

    const handleSubmit = (event) => {
        event.preventDefault();
        socket.emit('createUser', { username, pseudo, password , passwordConfirm});
        setUsername('');
        setPseudo('');
        setPassword('');
        setpasswordConfirm('');
    };

    return (
        <>
            <div className='containerConnectInscri'>
                <div className='centerConnectInscri'>
                    <form onSubmit={handleSubmit}>
                        <h2>Inscription</h2>
                        {message.text && (<p style={{ color: message.color }}>{message.text}</p> )}
                        <input type="text" id="username" placeholder="Nom d'utilisateur" required minLength="3" maxLength="24" pattern="^[a-zA-Z0-9]{3,24}$" value={username} onChange={(e) => setUsername(e.target.value)}/>
                        <input type="text" id="pseudo" placeholder="Pseudo" required minLength="3" maxLength="24" pattern="^[a-zA-Z0-9]{3,24}$" value={pseudo} onChange={(e) => setPseudo(e.target.value)}/>
                        <input type="password" id="password" placeholder="Mot de passe" required minLength="3" maxLength="64" value={password} onChange={(e) => setPassword(e.target.value)}/>
                        <input type="password" id="passwordConfirm" placeholder="Confirmation mot de passe" required minLength="3" maxLength="64" value={passwordConfirm} onChange={(e) => setpasswordConfirm(e.target.value)}/>
                        <button type="submit">Créer un compte</button>
                    </form>
                </div>
            </div>
        </>
    );
}

export default Inscription;