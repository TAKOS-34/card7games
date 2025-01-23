import React,{ useState,useEffect, useRef,useContext } from 'react';
import { useParams } from 'react-router-dom';
import socket from './socket';

function Chat(props) {

    const [chatArea,setChatAera] = useState('');
    const [playerMessage,setPlayerMessage] = useState('');
    const textareaRef = useRef();
    const roomId = props.roomId;
    const pseudo = props.pseudo;

    const handleSendMessage = () => {  
        socket.emit('chatUpdate',{playerMessage,roomId,pseudo});
        setPlayerMessage('');
    };

    const handleEnterSendMessage = (event) => {
        if(event.key=='Enter'){
            socket.emit('chatUpdate',{playerMessage,roomId,pseudo});
            setPlayerMessage('');
        }
    };

    useEffect(() => {
        socket.on('chatUpdate', (data) => {
            const currentTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            setChatAera(prevChatArea => `${prevChatArea} <${currentTime} | ${data.pseudo}> : ${data.message}\n`);
        });
        return () => { socket.off('chatUpdate'); }
    }, []);

    useEffect(() => {
        textareaRef.current.scrollTop  = textareaRef.current.scrollHeight;
    }, [chatArea]);

    return (
        <>
            <textarea ref={textareaRef} readOnly value={chatArea} className='chatArea'></textarea>
            <input type="text" autoComplete="off" id="playerMessage" placeholder='Ecrivez votre message...' required minLength="1" maxLength="100" value={playerMessage} onKeyDown={handleEnterSendMessage} onChange={(e) => setPlayerMessage(e.target.value)} className='playerMessage'/>
            <button onClick={handleSendMessage} id="sendMsgChat">Envoyez un message</button>
        </>
    )
}

export default Chat;