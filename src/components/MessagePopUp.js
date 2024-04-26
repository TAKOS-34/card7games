import React from 'react';
import '../styles/MessagePopUp.css';

const MessagePopUp = ({ message, idpop, color }) => {
  return (
    <div className="message-popup" id={idpop} style={{color:color}}>
      {message}
    </div>
  );
};

export default MessagePopUp;