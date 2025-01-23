import React from 'react';
import '../styles/Footer.css';
import { Link } from 'react-router-dom';

function Footer() {
    return (
    <footer className="footer">
        <Link to='/credits'>MADE BY GROUP 7</Link>
    </footer>
    );
}

export default Footer;
