import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './App';
import socket from './socket';
import '../styles/ConnexionInscription.css';

function Connexion() {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState({ text: '', color: '' });
    const { setIsLoggedIn,isLoggedIn } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if(isLoggedIn) {
            setTimeout(() => {navigate('/');},1000);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        socket.on('sendToken', (data) => {
            const accessToken = data.accessToken;
            localStorage.setItem('accessToken', accessToken);
            setIsLoggedIn(true);
        });
        socket.on('messageConnexion', (data) => {
            setMessage(data);
            setTimeout(() => {setMessage('');},5000);
        });
        return () => {
            socket.off('sendToken');
            socket.off('messageConnexion');
        };
    }, []);

    const handleSubmit = (event) => {
        event.preventDefault();
        socket.emit('connexionUser', { username, password });
    }

    return (
        <div className='containerConnectInscri'>
            <div className='centerConnectInscri'>
                <form onSubmit={handleSubmit}>
                    <h2>Connexion</h2>
                    {message.text && (<p style={{ color: message.color }}>{message.text}</p>)}
                    <input type="text" id="username" placeholder="Nom d'utilisateur" required minLength="3" maxLength="24" pattern="^[a-zA-Z0-9]{3,24}$" value={username} onChange={(e) => setUsername(e.target.value)} />
                    <input type="password" id="password" placeholder="Mot de passe" required minLength="3" maxLength="64" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="submit">Se connecter</button>
                    <p className="link-text">
                        <Link to="/inscription">Vous n'avez pas de compte ? Inscrivez-vous.</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default Connexion;
