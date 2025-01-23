import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { AuthContext } from './App';
import logo from '../assets/logo.png';
import '../styles/Header.css';
import socket from './socket';

function Header() {

    const navigate = useNavigate();

    const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
    const token=localStorage.getItem('accessToken');
    let username;
    if(token){
        const base64Payload = token.split('.')[1];
        const decodedPayload = atob(base64Payload);
        const payload = JSON.parse(decodedPayload);
        username = payload.username;
    }

    const handleLogout = () => {
        socket.emit('deconnexion',{username,"socketId":socket.id});
        localStorage.removeItem('accessToken');
        setIsLoggedIn(false);
    }

    socket.on('deconnexionAll',(data) => {
        if(data === username){
            localStorage.removeItem('accessToken');
            setIsLoggedIn(false);
        }
    });

    const handleButtons = () => {
        socket.emit('handleButtons',{username,"socketId":socket.id});
    }

    const handleLogo = () => {
        handleButtons();
        navigate('/');
    }

    return (
        <header className="header">
            <img src={logo} alt="Logo" className="header-logo" onClick={handleLogo} />
            <nav className="header-nav">
                <Link to="/">
                    <button onClick={handleButtons}>Accueil</button>
                </Link>
                {isLoggedIn ? (
                    <>
                        <Link to="/profil">
                            <button onClick={handleButtons}>Mon Profil</button>
                        </Link>
                        <Link to="/classement">
                            <button onClick={handleButtons}>Classement</button>
                        </Link>
                        <a>
                            <button onClick={handleLogout}>Déconnexion</button>
                        </a>
                    </>
                ) : (
                    <>
                        <Link to="/connexion">
                            <button>Connexion</button>
                        </Link>
                        <Link to="/inscription">
                            <button>Inscription</button>
                        </Link>
                    </>
                )}
            </nav>
        </header>
    );
}

export default Header;