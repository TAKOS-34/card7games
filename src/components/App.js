import React, { useState, useEffect } from 'react';
import Header from './Header';
import Accueil from './Accueil';
import Footer from './Footer';
import Inscription from './Inscription';
import Connexion from './Connexion';
import Profil from './Profil';
import Room from './Room';
import Bataille from './Bataille';
import SixQuiPrend from './SixQuiPrend';
import Uno from './Uno';
import Classement from './Classement';
import Credits from './Credits';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

export const AuthContext = React.createContext(null);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/room/:roomId" element={<Room />} />
          <Route path="/bataille/:roomId" element={<Bataille />} />
          <Route path="/sixquiprend/:roomId" element={<SixQuiPrend />} />
          <Route path="/uno/:roomId" element={<Uno />} />
          <Route path="/classement" element={<Classement />} />
          <Route path="/credits" element={<Credits/>} />
          <Route path="*" element={<Accueil />} />
        </Routes>
        <Footer />
      </Router>
    </AuthContext.Provider>
  );
}

export default App;