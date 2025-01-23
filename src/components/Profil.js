import React from "react";
import { useState,useContext, useEffect} from "react";
import { AuthContext } from "./App";
import socket from "./socket";
import MessagePopUp from "./MessagePopUp";
import { useNavigate } from "react-router";
import '../styles/Profil.css';

function Profil(){

    const [oldPassword,setOldPassword] = useState('');
    const [oldPassword2,setOldPassword2] = useState('');
    const [oldPassword3,setOldPassword3] = useState('');
    const [newPassword1,setNewPassword1] = useState('');
    const [newPassword2,setNewPassword2] = useState('');
    const [newPseudo,setNewPseudo] = useState('');
    const [message,setMessage] = useState({text:'',color:''});
    const navigate = useNavigate();

    // ----------------- RECUPERATION INFORMATIONS JOUEUR
    const token = localStorage.getItem('accessToken');
    const { isLoggedIn,setIsLoggedIn } = useContext(AuthContext);
    let username, userId, pseudo;
    if (token) {
        const base64Payload = token.split('.')[1];
        const decodedPayload = atob(base64Payload);
        const payload = JSON.parse(decodedPayload);
        username = payload.username;
        userId = payload.id;
        pseudo = payload.pseudo;
    }
    useEffect(() => {
        if(!isLoggedIn) {
            navigate('/'); 
        }
    }, [isLoggedIn]);

    useEffect(() => {
        socket.on('deconnexion', () => {
            setTimeout(() => {
                socket.emit('deconnexion',{username,"socketId":socket.id});
                localStorage.removeItem('accessToken');
                setIsLoggedIn(false);
                navigate('/');
            },2000);
        });
        return () => { socket.off('deconnexion'); }
    }, []);

    useEffect(() => {
        socket.on('messageProfil',(data) => {
            setMessage(data);
        });
        return () => { socket.off('messageProfil'); }
    }, []);

    const handleSubmitChangePassword = (event) => {
        event.preventDefault();
        if(newPassword1 === newPassword2) {
            socket.emit('changePassword',{userId,username,oldPassword,newPassword1,newPassword2})
        } else {
            setMessage({'text':'Les deux mots de passe doivent correspondre','color':'red'}); 
            setTimeout(() => {setMessage('');},5000);
        }  
        setNewPassword1('');
        setNewPassword2('');
    };

    const handleSubmitChangePseudo = (event) => {
        event.preventDefault();
        socket.emit('changePseudo',{userId,username,newPseudo,"oldPassword":oldPassword2});
        setNewPseudo('');
        setOldPassword2('');
    }

    const handleSubmitDeleteAccount = (event) => {
        event.preventDefault();
        socket.emit('deleteAccount',{userId,username,pseudo,"oldPassword":oldPassword3});
        setOldPassword3('');
    }

    return (
        <>
            <div className='containerProfil'>
            {message.text && (<MessagePopUp message={message.text} color={message.color}/>)}
                <div className='centerProfil'>
                    <h2>Votre Profil | {pseudo}</h2>
                    <form onSubmit={handleSubmitChangePassword}>
                        <p>Changer votre mot de passe</p>
                        <input type="password" id="oldPassword" placeholder="Votre ancien mot de passe" required minLength="3" maxLength="64" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}/>
                        <input type="password" id="newPassword1" placeholder="Votre nouveau mot de passe" required minLength="3" maxLength="64" value={newPassword1} onChange={(e) => setNewPassword1(e.target.value)}/>
                        <input type="password" id="newPassword2" placeholder="Confirmer votre nouveau mot de passe" required minLength="3" maxLength="64" value={newPassword2} onChange={(e) => setNewPassword2(e.target.value)}/>
                        <button>Changer le mot de passe</button>
                    </form>
                    <form onSubmit={handleSubmitChangePseudo}>
                        <p>Changer votre pseudo</p>
                        <input type="text" id="newPseudo" placeholder="Votre nouveau pseudo" required minLength="3" maxLength="24" pattern="^[a-zA-Z0-9]{3,24}$" value={newPseudo} onChange={(e) => setNewPseudo(e.target.value)}/>
                        <input type="password" id="oldPassword2" placeholder="Votre mot de passe" required minLength="3" maxLength="64" value={oldPassword2} onChange={(e) => setOldPassword2(e.target.value)}/>
                        <button>Changer votre pseudo</button>
                    </form>
                    <form onSubmit={handleSubmitDeleteAccount}>
                        <p>Supprimer votre compte</p>
                        <input type="password" id="oldPassword3" placeholder="Votre mot de passe" required minLength="3" maxLength="64" value={oldPassword3} onChange={(e) => setOldPassword3(e.target.value)}/>
                        <button>Supprimer votre compte</button>
                    </form>
                </div>
            </div>
        </>
    )
}

export default Profil;