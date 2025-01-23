// ----------------------- MISE EN PLACE SERVEUR

const express = require('express');
const app = express();
const {Server}=require('socket.io');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config({path:"../.env"});
const io = new Server(process.env.BACKEND_PORT,{
    cors :{
        origin : process.env.FRONTEND_URL
    }
});

// ----------------------- MISE EN PLACE SERVEUR

function heure() { return `<${new Date().toLocaleString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'})}>`; }

let db;
async function main() {
    try {
        db = await open({
            filename: 'cardgames.db',
            driver: sqlite3.Database
        });
        console.log(`${heure()} Connexion à la base de données réussie`);
    } catch (e) {
        console.error(`${heure()} Erreur lors de la connexion à la base de donnéese => [${e}]`);
    }
}
main().catch(console.error);

// ----------------------- VARIABLES SERVEUR

const rooms = {};
const games = {};
const botNames = ["Liam","Emma","Noah","Olivia","William","Ava","James","Isabella","Oliver","Sophia","Benjamin","Charlotte","Elijah","Mia","Lucas","Amelia","Mason","Harper","Logan","Evelyn","Alexander","Abigail","Ethan","Emily","Jacob","Elizabeth","Michael","Mila","Daniel","Ella","Henry","Avery","Jackson","Sofia","Sebastian","Camila","Aiden","Aria","Matthew","Scarlett","Samuel","Victoria","David","Madison","Joseph","Luna","Carter","Grace","Owen","Chloe","Wyatt","Penelope","John","Layla","Jack","Riley","Luke","Zoey","Jayden","Nora","Dylan","Lily","Grayson","Hannah","Levi","Eleanor","Isaac","Savannah","Gabriel","Brooklyn","Julian","Audrey","Mateo","Claire","Anthony","Eliana","Jaxon","Stella","Lincoln","Paisley","Joshua","Violet","Christopher","Skylar","Andrew","Everly","Theodore","Nova","Caleb","Genesis","Ryan","Emilia","Asher","Emery","Nathan","Madelyn","Thomas","Josephine"];
const printBotDifficulty = true;

// DEBUG
/* 
setInterval(() => {
    Object.values(rooms).forEach(room => {console.log(room)});
    Object.values(games).forEach(game => {console.log(game)})
},5000);*/

// ----------------------- CONNEXION - INSCRIPTION - MODIFICATION - SUPPRESSION - DECONNEXION

// SocketIO
io.on("connection",(socket) => {

    let sessionJwt = socket.handshake.query.session;

    // Inscription
    socket.on('createUser', async (data) => {
        console.log(`${heure()} [${data.username}] => Tente de créer un compte`);
        const usernamePattern = /^[a-zA-Z0-9_-]{3,24}$/;
        try {
            if(usernamePattern.test(data.username) && usernamePattern.test(data.pseudo) && data.password.length>=3 && data.password.length<=64 && data.passwordConfirm.length>=3 && data.passwordConfirm.length<=64) {
                if(data.password == data.passwordConfirm){
                    const existingUser = await db.get('SELECT * FROM account WHERE username = ?',data.username);
                    if (existingUser) {
                        console.log(`${heure()} [${data.username}] => Echec de la création du compte => [Le nom d'utilisateur existe déjà]`);
                        socket.emit('messageInscription', {text: "Ce nom d'utilisateur existe déjà",color: 'red'});
                    } else {
                        try {
                            const hashedPassword=await bcrypt.hash(data.password,10);
                            await db.run('INSERT INTO account (username, pseudo ,password) VALUES (?, ?, ?)', data.username, data.pseudo, hashedPassword);
                            await db.run('INSERT INTO classement (pseudo) VALUES (?)',data.pseudo);
                            console.log(`${heure()} [${data.username}] => Création de compte réussie`);
                            socket.emit('messageInscription', {'text':'Inscription réussie.. Vous allez être redigiré.','color':'green'});
                            socket.emit('inscriptionReussie');
                        } catch (bcrypterror) {
                            console.log(`${heure()} [${data.username}] => Echec de la création du compte => [${bcrypterror}]`);
                            socket.emit('messageInscription', {'text':'Une erreur est survenue lors de la création de l\'utilisateur','color':'red'});
                        }
                    }
                } else {
                    console.log(`${heure()} [${data.username}] => Echec de la création du compte => [Les deux mots de passe ne correspondent pas]`);
                    socket.emit('messageInscription',{'text':'Les deux mots de passe ne correspondent pas','color':'red'});
                }
            } else {
                console.log(`${heure()} [${data.username}] => Echec de la création du compte => [Erreur de saisie dans les champs]`);
                socket.emit('messageInscription', {'text':'Erreur de saisie dans les champs','color':'red'});
            }
            
        } catch (error) {
            console.log(`${heure()} [${data.username}] => Echec de la création du compte => [${error}]`);
            socket.emit('messageInscription', {'message':'Une erreur est survenue lors de la création de l\'utilisateur','color':'red'});
        }
    });

    // Connexion
    socket.on('connexionUser', async (data) => {
        console.log(`${heure()} [${data.username}] => Tente de se connecter`);
        const usernamePattern = /^[a-zA-Z0-9_-]{3,24}$/;
        try {
            if(usernamePattern.test(data.username) && data.password.length>=3 && data.password.length<=64) {
                const existingUser = await db.get('SELECT * FROM account WHERE username = ?',data.username);
                if (!existingUser) {
                    console.log(`${heure()} [${data.username}] => Echec de la connection => [Le nom d'utilisateur n'existe pas]`);
                    socket.emit('messageConnexion', {'text': "Le nom d'utilisateur n'existe pas",'color': 'red'});
                } else {
                    const userPassword = await db.get('SELECT password FROM account WHERE username= ?',data.username);
                    try {
                        const testSamePassword = await bcrypt.compare(data.password,userPassword.password);
                        if(testSamePassword) {
                            const user = {id: existingUser.id, username: existingUser.username, pseudo:existingUser.pseudo};
                            const secretKey = crypto.randomBytes(32).toString('hex');
                            const accessToken = jwt.sign(user,secretKey);
                            socket.emit('messageConnexion',{'text':'Connexion réussie... Vous allez être redirigé.','color':'green'});
                            socket.emit('sendToken',{accessToken});
                            sessionJwt = accessToken;
                            console.log(`${heure()} [${data.username}] => Connexion réussie`);
                        } else {
                            console.log(`${heure()} [${data.username}] => Echec de la connection => [Mot de passe incorrect]`);
                            socket.emit('messageConnexion',{'text':'Mot de passe incorrect','color':'red'});
                        }
                    } catch (bcrypterror) {
                        console.log(`${heure()} [${data.username}] => Echec de la connection => [${bcrypterror}]`);
                        socket.emit('messageConnexion', {'text':'Une erreur est survenue lors de la connexion de l\'utilisateur','color':'red'});
                    }
                }
            } else {
                console.log(`${heure()} [${data.username}] => Echec de la connection => [Erreur de saisie dans les champs]`);
                socket.emit('messageConnexion', {'text':'Erreur de saisie dans les champs','color':'red'});
            }
        } catch (error) {
            console.log(`${heure()} [${data.username}] => Echec de la connection => [${error}]`);
            socket.emit('messageConnexion', {'message':'Une erreur est survenue lors de la connexion de l\'utilisateur','color':'red'});
        }
    });

    // Modification mot de passe
    socket.on('changePassword',async (data) => {
        console.log(`${heure()} [${data.username}] => Tente de modifier son mot de passe`);
        try {
            if(data.newPassword1.length>=8 && data.newPassword1.length<=64){
                if(data.newPassword1==data.newPassword2){
                    const currentUserPassword = await db.get('SELECT password FROM account WHERE id= (?)',data.userId);
                    try {
                        const testSamePassword = await bcrypt.compare(data.oldPassword,currentUserPassword.password);
                        if(testSamePassword) {
                            const newPasswordUser = await bcrypt.hash(data.newPassword1,10);
                            await db.run('UPDATE account SET password = (?) WHERE id = (?)',newPasswordUser,data.userId);
                            socket.emit('messageProfil',{'text':'Changement de mot de passe effectué avec succès, vous allez être déconnecté...','color':'green'});
                            socket.emit('deconnexion');
                            console.log(`${heure()} [${data.username}] => Modification de mot de passe réussie`);
                        } else {
                            console.log(`${heure()} [${data.username}] => Echec de modification du mot de passe => [L'ancien mot de passe est faux]`);
                            socket.emit('messageProfil',{'text':'L\'ancien mot de passe est faux','color':'red'});
                        }
                    } catch (bcrypterror){
                        console.log(`${heure()} [${data.username}] => Echec de modification du mot de passe => [${bcrypterror}]`);
                        socket.emit('messageProfil',{'text':'Une erreur est survenu lors du changement de mot de passe','color':'red'});
                    }
                } else {
                    console.log(`${heure()} [${data.username}] => Echec de modification du mot de passe => [Les deux mots de passe ne correspondent pas]`);
                    socket.emit('messageProfil',{'text':'Les deux mots de passe ne correspondent pas','color':'red'});
                }
            } else {
                console.log(`${heure()} [${data.username}] => Echec de modification du mot de passe => [Erreur de saisie dans les champs]`);
                socket.emit('messageProfil',{'text':'Erreur de saisie dans les champs','color':'red'});
            }
        } catch (error) {
            console.log(`${heure()} [${data.username}] => Echec de modification du mot de passe => [${error}]`);
            socket.emit('messageProfil',{'text':'Une erreur est survenu lors du changement de mot de passe','color':'red'});
        }
    });

    // Modification pseudo
    socket.on('changePseudo',async (data) => {
        console.log(`${heure()} [${data.username}] => Tente de modifier son pseudo`);
        try {
            if(data.oldPassword.length>=8 && data.oldPassword.length<=64){
                const currentUserPassword = await db.get('SELECT password FROM account WHERE id= (?)',data.userId);
                try {
                    const testSamePassword = await bcrypt.compare(data.oldPassword,currentUserPassword.password);
                    if(testSamePassword){
                        await db.run('UPDATE account SET pseudo = (?) WHERE id = (?)',data.newPseudo,data.userId);
                        socket.emit('messageProfil',{'text':'Pseudo changé avec succès, vous allez être déconnecté...','color':'green'});
                        socket.emit('deconnexion');
                        console.log(`${heure()} [${data.username}] => Modification du pseudo réussie`);
                    } else {
                        console.log(`${heure()} [${data.username}] => Echec de la modification du pseudo => [L'ancien mot de passe est faux]`);
                        socket.emit('messageProfil',{'text':'L\'ancien mot de passe est faux','color':'red'});
                    }
                } catch (bcrypterror){
                    console.log(`${heure()} [${data.username}] => Echec de la modification du pseudo => [${bcrypterror}]`);
                    socket.emit('messageProfil',{'text':'Une erreur est survenu lors du changement de pseudo','color':'red'});
                }
            } else {
                console.log(`${heure()} [${data.username}] => Echec de la modification du pseudo => [Erreur de saisie dans les champs]`);
                socket.emit('messageProfil',{'text':'Erreur de saisie dans les champs','color':'red'});
            }
        } catch (error) {
            console.log(`${heure()} [${data.username}] => Echec de la modification du pseudo => [${error}]`);
            socket.emit('messageProfil',{'text':'Une erreur est survenu lors du changement de pseudo','color':'red'});
        }
    });

    // Suppression de compte
    socket.on('deleteAccount',async (data) => {
        console.log(`${heure()} [${data.username}] => Tente de supprimer son compte`);
        try {
            if(data.oldPassword.length>=8 && data.oldPassword.length<=64){
                const currentUserPassword = await db.get('SELECT password FROM account WHERE id= (?)',data.userId);
                try {
                    const testSamePassword = await bcrypt.compare(data.oldPassword,currentUserPassword.password);
                    if(testSamePassword){
                        await db.run('DELETE FROM account WHERE id = (?)',data.userId);
                        await db.run('DELETE FROM classement WHERE id = (?)',data.userId);
                        socket.emit('messageProfil',{'text':'Compte supprimé avec succès, vous allez être déconnecté...','color':'green'});
                        socket.emit('deconnexion');
                        console.log(`${heure()} [${data.username}] => Suppression du compte réussie`);
                    } else {
                        console.log(`${heure()} [${data.username}] => Echec de la suppression du compte => [L'ancien mot de passe est faux]`);
                        socket.emit('messageProfil',{'text':'L\'ancien mot de passe est faux','color':'red'});
                    }
                } catch (bcrypterror){
                    console.log(`${heure()} [${data.username}] => Echec de la suppression du compte => [${bcrypterror}]`);
                    socket.emit('messageProfil',{'text':'Une erreur est survenu lors de la suppression du compte','color':'red'});
                }
            } else {
                console.log(`${heure()} [${data.username}] => Echec de la suppression du compte => [Erreur de saisie dans les champs]`);
                socket.emit('messageProfil',{'text':'Erreur de saisie dans les champs','color':'red'});
            }
        } catch (error) {
            console.log(`${heure()} [${data.username}] => Echec de la suppression du compte => [${error}]`);
            socket.emit('messageProfil',{'text':'Une erreur est survenu lors de la suppression du compte','color':'red'});
        }
    });

// ----------------------- ROOM

    // Getter de room
    function pseudoInRoom(roomId){ return rooms[roomId].players.map(player => player.pseudo); }

    function updateRooms() {
        const roomList = Object.keys(rooms)
            .filter(key => rooms[key].status === 'waiting')
            .map(key => ({
                roomId: key,
                gametype: rooms[key].gametype,
                gameName: rooms[key].gameName,
                nbPlayerRequired: rooms[key].nbPlayerRequired,
                nbActualPlayers: rooms[key].nbActualPlayers,
            }));
        io.emit('sendAllRoom', roomList);
    }

    function getNameFromGameId(gameId) {
        switch(gameId) {
            case 1: return 'Bataille';
            case 2: return 'Six Qui Prend';
            case 3: return 'Uno';
            default: return 'error';
        }
    }

    socket.on('getAllRoom',() => {
        updateRooms();
    });

    async function isPlayerInPausedGame(playerId, roomId) {
        const pausedGames = await getAllSavedGames();
    
        const game = pausedGames.find(game => game.gameId === roomId);
    
        if (game) {
            const players = JSON.parse(game.gameData).players.map(player => player.id);
            return players.includes(playerId);
        }
    
        return false;
    }

    socket.on('getPausedRooms', async (data) => {
        const pausedRooms = await getAllSavedGames();
        const parsedRooms = pausedRooms.map(room => ({
            gameId: room.gameId,
            gameLeader: room.gameLeader,
            gameType: room.gameType,
            gameName: room.gameName,
            gameData: JSON.parse(room.gameData)
        }));
    
        const filteredRooms = parsedRooms.filter(room => {
            const players = room.gameData.players.map(player => player.id);
            return players.includes(data.playerId);
        });
        socket.emit('sendPausedRooms', filteredRooms);
    });

    // Création de Room
    socket.on('createRoom',async (data) => {
        if (data.rejoin) {
            console.log(`${heure()} [${data.username}] => Tente de rejoindre la room [${data.createRoomId}] sauvegardée`);
            const isPlayerInPaused = await isPlayerInPausedGame(data.id, data.createRoomId);
            if (isPlayerInPaused) {
                if (!rooms.hasOwnProperty(data.createRoomId)) {
                    let game = await searchRoom(data.createRoomId);
                    if (game) {
                        if (game.gameLeader !== data.id) {
                            socket.emit('messageCentralElementCreate',{'text':"Le leader n'a pas encore recréer la partie",'color':'red'});
                            console.log(`${heure()} [${data.username}] => Ne peut pas rejoindre la room [${data.createRoomId}] => [Le leader n'a pas encore recréer la room]`);
                        } else {
                            let gameData = JSON.parse(game.gameData);
                            rooms[data.createRoomId] = {
                                'leaderId': data.id,
                                'gametype' : game.gameType,
                                'gameName' : game.gameName,
                                'status' : 'recreating',
                                'players': [],
                                'nbPlayerRequired':Object.keys(gameData.players).length,
                                'nbActualPlayers':0,
                                'isRejoin':true
                            };
                            console.log(`${heure()} [${data.username}] => Réussite de recréation de la room [${data.createRoomId}] car il était le leader`);
                            joinRoom(data.createRoomId,data.id,data.username,data.pseudo,data.socketId);
                            for(let player of gameData.players) {
                                if(player.isBot) { 
                                    joinRoom(data.createRoomId,player.id,player.username,player.pseudo,player.socketId,true);
                                }
                            }
                            updateRooms();
                        }
                    }
                } else {
                    joinRoom(data.createRoomId,data.id,data.username,data.pseudo,data.socketId);
                    updateRooms();
                }
            } else {
                socket.emit('messageCentralElementCreate',{'text':"Vous ne pouvez pas rejoindre cette partie",'color':'red'});
                console.log(`${heure()} [${data.username}] => Tentative de re-rejoindre la partie [${data.createRoomId}] => [Joueur non autorisé]`);
            }
        } else {
            console.log(`${heure()} [${data.username}] => Tente de créer la room [${data.createRoomId}]`);
            if (data.createRoomId && data.selectGame && data.nbPlayerRequired>=2 && data.nbPlayerRequired<=10) {
                if (!rooms.hasOwnProperty(data.createRoomId)) {    
                    if (!data.rejoin) {
                        const gameName = getNameFromGameId(parseInt(data.selectGame));
                        rooms[data.createRoomId] = {
                            'leaderId': data.id,
                            'gametype' : data.selectGame,
                            'gameName' : gameName,
                            'status' : 'waiting',
                            'players': [],
                            'nbPlayerRequired':data.nbPlayerRequired,
                            'nbActualPlayers':0,
                            'isRejoin':false
                        };
                        console.log(`${heure()} [${data.createRoomId}] => Création de la room réussie`);
                        joinRoom(data.createRoomId,data.id,data.username,data.pseudo,data.socketId);
                        updateRooms();
                    }
                } else {
                    socket.emit('messageCentralElementCreate',{'text':'Une partie de cet id existe déjà','color':'red'});
                    console.log(`${heure()} [${data.createRoomId}] => Echec de la créatioon de la room => [Une partie de cet id existe déjà]`);
                }
            } else {
                socket.emit('messageCentralElementCreate',{'text':"Erreur dans les champs de saisie",'color':'red'});
                console.log(`${heure()} [${data.createRoomId}] => Echec de la créatioon de la room => [Erreur dans les champs de saisie]`);
            }
        }
    });

    // Socket pour rejoindre une Room
    socket.on('joinRoom',(data) => {
        if(rooms[data.room] && !data.rejoin) {
            if (!(rooms[data.room].nbActualPlayers == rooms[data.room].nbPlayerRequired)) {
                joinRoom(data.room,data.id,data.username,data.pseudo,data.socketId);
            } else {
                socket.emit('messageCentralElementJoin',{'text':'La room est déjà pleine','color':'red'});
            }
        } else if (!rooms[data.room] && data.rejoin) {
            joinRoom(data.room,data.id,data.username,data.pseudo,data.socketId);
        } else {
            socket.emit('messageCentralElementJoin',{'text':'La room n\'existe pas','color':'red'});
        }
    });

    // Fonction pour rejoindre une Room
    function joinRoom(roomId,playerId,username,pseudo,socketId,isBot,botDifficulty) {
        console.log(`${heure()} [${username}] => Tente de rejoindre la room [${roomId}]`);
        if (rooms[roomId]){
            if (rooms[roomId].status == 'waiting' || rooms[roomId].status == 'recreating'){
                const existingPlayerInRoom = rooms[roomId].players.some(player => player.id === playerId);
                if(!existingPlayerInRoom){
                    rooms[roomId].players.push({"id":playerId,"username":username,"pseudo":`${pseudo}${(isBot && printBotDifficulty) ? ` (${botDifficulty})` : ''}`,"socketId":socketId,"isBot":isBot,"botDifficulty":botDifficulty});
                    rooms[roomId].nbActualPlayers++;
                    socket.join(roomId);
                    socket.emit('roomJoined',{ 'roomId':roomId });
                    updateListPlayers(roomId);
                    console.log(`${heure()} [${username}] => Le joueur à rejoint la room [${roomId}]`);
                    updateRooms();
                } else {
                    socket.emit('messageCentralElementJoin',{'text':'Vous êtes déjà dans la room','color':'red'});
                    console.log(`${heure()} [${username}] => Ne peut pas rejoidnre la room [${roomId}] => [Le joueur est déjà dans la room]`);
                }
            } else {
                socket.emit('messageCentralElementJoin',{'text':'La room est déjà en jeu','color':'red'});
                console.log(`${heure()} [${username}] => Ne peut pas rejoidnre la room [${roomId}] => [La room est déjà en jeu]`);
            }
        } else {
            socket.emit('messageCentralElementJoin',{'text':'La room n\'existe pas','color':'red'});
            console.log(`${heure()} [${username}] => Ne peut pas rejoidnre la room [${roomId}] => [La room n'existe pas]`);
        }
    };

    // Quitter une Room
    socket.on('leaveRoom', (data) => {
        console.log(`${heure()} [${data.username}] => Tente de quitter la room [${data.roomId}]`);
        if (rooms[data.roomId]) {
            if (rooms[data.roomId].leaderId == data.id) {
                leaveSocket(data.roomId);
                io.to(data.roomId).emit('leaderLeaveRoom');
                let gameType = parseInt(rooms[data.roomId].gametype);
                delete rooms[data.roomId];
                if(games[data.roomId]) {
                    penaltyForLeaving(gameType,data.id);
                    console.log(`${heure()} [${data.username}] => La joueur à quitté la room [${data.roomId}] alors qu'elle était en jeu, il a donc écopé d'une pénalité`);
                    delete games[data.roomId];
                }
                updateRooms();
                console.log(`${heure()} [${data.username}] => La joueur à quitté la room [${data.roomId}]. Il était le leader, la room est supprimé`);
            } else {
                let index = rooms[data.roomId].players.findIndex(player => player.id === data.id);
                if (index !== -1) {
                    const pseudo = rooms[data.roomId].players[index].pseudo;
                    const id = rooms[data.roomId].players[index].id;
                    rooms[data.roomId].players.splice(index, 1);
                    rooms[data.roomId].nbActualPlayers--;
                    updateListPlayers(data.roomId);
                    if (games[data.roomId]) {
                        penaltyForLeaving(parseInt(rooms[data.roomId].gametype),data.id);
                        console.log(`${heure()} [${data.username}] => La joueur à quitté la room [${data.roomId}] alors qu'elle était en jeu, il a donc écopé d'une pénalité`);
                        if (games[data.roomId].players.length < 2) {
                            console.log(`${heure()} [${data.roomId}] => La partie est supprimé => [Il ne reste plus qu'un seul joueur]`);
                            io.to(data.roomId).emit('leaderLeaveRoom');
                            delete rooms[data.roomId];
                            delete games[data.roomId];
                        } else {
                            playerLeavingGame(parseInt(rooms[data.roomId].gametype),data.roomId,id,pseudo);
                        }
                    }
                    leaveSocket(data.roomId);
                    console.log(`${heure()} [${data.username}] => Le joueur a quitté la room [${data.roomId}]`);
                } else {
                    console.log(`${heure()} [${data.username}] => Le joueur n'a pas pu quitter la room [${data.roomId}] => [Le joueur n'est pas dans la room]`);
                }
            }
        } else {
            console.log(`${heure()} [${data.username}] => Le joueur n'a pas pu quitter la room [${data.roomId}] => [La room n'existe pas]`);
        }
    });

    // Gestion des bots
    socket.on('addBot',(data) => {
        if (rooms[data.roomId] && rooms[data.roomId].leaderId == data.id && !data.rejoin && !(rooms[data.roomId].nbActualPlayers >= rooms[data.roomId].nbPlayerRequired)) {
            const socketIdBot = Math.floor(Math.random() * (100000000 - 100000 + 1) + 100000);
            const botId = socketIdBot;
            const pseudoBot = 'Bot '+ botNames[Math.floor(Math.random()*botNames.length)];
            const botDifficulty = data.botDifficulty;
            joinRoom(data.roomId,botId,socketIdBot,pseudoBot,socketIdBot,true,botDifficulty);
        } else {
            socket.emit('messageGame',{'text':'La room est pleine','color':'red'});
        }
    });

    socket.on('deleteBot',(data) => {
        if (rooms[data.roomId] && rooms[data.roomId].leaderId == data.id && !data.rejoin && rooms[data.roomId].nbActualPlayers > 1) {
            let success = false;
            for(let i = rooms[data.roomId].players.length - 1;i >= 0; i--) {
                if(rooms[data.roomId].players[i].isBot === true) {
                    rooms[data.roomId].players.splice(i,1);
                    rooms[data.roomId].nbActualPlayers--;
                    updateListPlayers(data.roomId);
                    updateRooms();
                    success = true;
                    break;
                }
            }
            if(!success) { socket.emit('messageGame',{'text':'Il n\'y a plus de bot dans la room','color':'red'}); }
        } else {
            socket.emit('messageGame',{'text':'Il n\'y a plus de bot dans la room','color':'red'});
        }
    });

    // Envoie informations des rooms
    socket.on('getRoomsInfos',(roomId) => {
        socket.emit('sendRoomsInfos',{'leaderId':rooms[roomId].leaderId,'pseudoList':pseudoInRoom(roomId),'nbActualPlayers':rooms[roomId].nbActualPlayers,'nbPlayerRequired':rooms[roomId].nbPlayerRequired,'gameName':rooms[roomId].gameName,'isRejoin':rooms[roomId].isRejoin});
    });

    function updateListPlayers(roomId) {
        io.to(roomId).emit('updateListPlayers', {'pseudoList': pseudoInRoom(roomId),'nbActualPlayers': rooms[roomId].nbActualPlayers});
    }

    // Initialisation de la partie
    socket.on('startGame',async (data) => {
        console.log(`${heure()} [${data.roomId}] => Tentative de lancement de la partie`);
        if(data.id === rooms[data.roomId].leaderId){
            if (rooms[data.roomId].status !== 'recreating') {
                if (rooms[data.roomId].nbActualPlayers >= 2) {
                    io.to(data.roomId).emit('startGame',{"roomId":data.roomId,"gameType":parseInt(rooms[data.roomId].gametype)});
                    rooms[data.roomId].status = 'started';
                    updateRooms();
                    console.log(`${heure()} [${data.roomId}] => La partie à été lancé avec ces joueurs => [${pseudoInRoom(data.roomId)}]`);
                    switch(parseInt(rooms[data.roomId].gametype)) {
                        case 1: 
                            games[data.roomId] = new Bataille(rooms[data.roomId].players,data.roomId,null);
                            break;
                        case 2:
                            games[data.roomId] = new SixQuiPrend(rooms[data.roomId].players,data.roomId,null);
                            break;
                        case 3:
                            games[data.roomId] = new Uno(rooms[data.roomId].players,data.roomId,null);
                            break;
                        default:
                            return;
                    }
                } else {
                    console.log(`${heure()} [${data.roomId}] => Echec du lancement => [Il n'y a pas assez de joueurs dans la partie]`);
                    socket.emit('messageGame',{'text':'Il n\'y a pas assez de joueurs dans la partie','color':'red'});
                }
            } else {
                if (rooms[data.roomId].nbActualPlayers == rooms[data.roomId].nbPlayerRequired) {
                    io.to(data.roomId).emit('startGame',{"roomId":data.roomId,"gameType":parseInt(rooms[data.roomId].gametype)});
                    rooms[data.roomId].status = 'started';
                    updateRooms();
                    let pseudoList = pseudoInRoom(data.roomId);
                    console.log(`${heure()} [${data.roomId}] => La partie à été relancé avec ces joueurs => [${pseudoList}]`);
                    try {
                        let previousGame = await searchRoom(data.roomId);
                        switch (parseInt(previousGame.gameType)) {
                            case 1:
                                games[data.roomId] = new Bataille(rooms[data.roomId].players,data.roomId,previousGame);
                                break;
                            case 2:
                                games[data.roomId] = new SixQuiPrend(rooms[data.roomId].players,data.roomId,previousGame);
                                break;
                            case 3:
                                games[data.roomId] = new Uno(rooms[data.roomId].players,data.roomId,previousGame);
                                break;
                            default:
                                break;
                        }
                        await deleteGameFromDB(data.roomId);
                    } catch (e) {
                        console.error(`${heure()} Erreur lors de la récupération du jeu => [${e}]`);
                    }
                } else {
                    console.log(`${heure()} [${data.roomId}] => Echec du relancement => [Il n'y a pas assez de joueurs dans la partie]`);
                    socket.emit('messageGame',{'text':'Il n\'y a pas assez de joueurs dans la partie','color':'red'});
                }
            }
        } else {
            console.log(`${heure()} [${data.roomId}] => Echec du lancement => [Le joueur qui à tenté de lancé la partie n'est pas le leader de la room]`);
            socket.emit('messageGame',{'text':'Vous n\'êtes pas le leader de la room','color':'red'});
        }
    });

    socket.on('isLeader',(data) => {
        if(games[data.roomId] || rooms[data.roomId]) {
            socket.emit('isLeader',(parseInt(data.id) === rooms[data.roomId].leaderId));
        }
    });

// ----------------------- GESTION SAUVEGARDE PARTIE

    socket.on('pauseGame', async (data) => {
        if (rooms[data.roomId] && games[data.roomId]) {
            console.log(`${heure()} [${data.roomId}] => Tentative de la mise en pause de la partie`);
            if(data.id === rooms[data.roomId].leaderId) {
                let savedGame = games[data.roomId];
                let savedGameJSON = JSON.stringify(savedGame);
                try {
                    console.log(`${heure()} [${data.roomId}] => Réussite de la mise en pause de la partie`);
                    await db.run('INSERT INTO games (gameId, gameLeader, gameType, gameName, gameData) VALUES (?, ?, ?, ?, ?)',data.roomId,data.id,parseInt(rooms[data.roomId].gametype),rooms[data.roomId].gameName,savedGameJSON);
                    leaveSocket(data.roomId);
                    io.to(data.roomId).emit('leaderLeaveRoom');
                    delete rooms[data.roomId];
                    delete games[data.roomId];
                } catch (e) {
                    console.log(`${heure()} [${data.roomId}] => Echec de la mise en pause de la partie => [${e}]`);
                }
            } else {
                console.log(`${heure()} [${data.roomId}] => Echec => [Le joueur qui a tenté de mettre la partie en pause n'est pas le leader]`);
            }
        }
    })

    async function getAllSavedGames() {
        const savedGames = await db.all('SELECT * from games');
        return savedGames;
    }

    async function searchRoom(roomId) {
        let savedGames = await getAllSavedGames();
        for (let games of savedGames) {
            if (roomId == games.gameId)
                return games;
        }
        return null;
    }

    async function deleteGameFromDB(roomId) {
        let gameExists = await searchRoom(roomId);
        if (gameExists) {
            try {
                await db.run('DELETE FROM games WHERE gameId = ?', roomId);
            } catch (e) {
                console.log(e, 'Erreur de suppression de la partie dans la base de données');
            }
        }
        else {
            console.log('not exists');
        }
    }

// ----------------------- GESTION DES JOUEURS QUI QUITTENT EN PLEINE PARTIE

    function playerLeavingGame(gameType,roomId,id,pseudo) {
        switch(gameType) {
            case 1 : {
                games[roomId].players.splice(games[roomId].players.findIndex(player => player.id === id),1);
                io.to(roomId).emit('initialisationBataille',(games[roomId].players));
                io.to(roomId).emit('messageBataille',{ message:`${pseudo} a quitté la partie` });
                break;
            }
            case 2 : {
                games[roomId].players.splice(games[roomId].players.findIndex(player => player.id === id),1);
                delete games[roomId].cartePrise[id];
                io.to(roomId).emit('initialisationSix', { 'players':games[roomId].players,'lines':games[roomId].lines,'cartePrise':games[roomId].cartePrise });
                io.to(roomId).emit('messageSix',{ message:`${pseudo} a quitté la partie` });
                break;
            }
            case 3 : {
                games[roomId].players.splice(games[roomId].players.findIndex(player => player.id === id),1);
                const newPlayerToPlay = games[roomId].players[games[roomId].indexToPlay];
                io.to(roomId).emit('nouveauTourUno', { 'id':newPlayerToPlay.id,'pseudo':newPlayerToPlay.pseudo,'players':games[roomId].players,'talon':games[roomId].talon[(games[roomId].talon.length)-1] });
                io.to(roomId).emit('messageUno',{ message:`${pseudo} a quitté la partie` });
                break;
            }
            default:break;
        }
    }

// ----------------------- DECONNEXION

    socket.on('deconnexion',(data) => {
        handleDisconnect(data.socketId);
        io.emit('deconnexionAll',data.username);
    });

    socket.on('disconnect', () => {
        handleDisconnect(socket.id);
    });

    socket.on('handleButtons', (data) => {
        handleDisconnect(data.socketId);
    });

    socket.on('leaveSocket',(roomId) => {
        leaveSocket(roomId);
    }); 

    function leaveSocket(roomId) {
        socket.leave(roomId);
    }

    // Gestion si joueur F5
    function handleDisconnect(socketId) {
        for(let room in rooms){
            for(let listPlayers of rooms[room].players){
                if(listPlayers.socketId==socketId){
                    let id=listPlayers.id;
                    if(id==rooms[room].leaderId){
                        let gameType = parseInt(rooms[room].gametype);
                        delete rooms[room];
                        if(games[room]) {
                            penaltyForLeaving(gameType,id);
                            console.log(`${heure()} [${socketId}] => La joueur à quitté la room [${room}] alors qu'elle était en jeu, il a donc écopé d'une pénalité`);
                            delete games[room];
                        }
                        leaveSocket(room);
                        io.to(room).emit('leaderLeaveRoom');
                        updateRooms();
                        console.log(`${heure()} [${socketId}] => La joueur à quitté la room [${room}]. Il était le leader, la room est supprimé`);
                    } else {
                        let index = rooms[room].players.findIndex(player => player.socketId === socket.id);
                        if (index !== -1) {
                            const pseudo = rooms[room].players[index].pseudo;
                            const id = rooms[room].players[index].id;
                            rooms[room].players.splice(index, 1);
                            rooms[room].nbActualPlayers--;
                            leaveSocket(room);
                            updateListPlayers(room);
                            if (games[room]) {
                                penaltyForLeaving(parseInt(rooms[room].gametype),id);
                                console.log(`${heure()} [${socketId}] => La joueur à quitté la room [${room}] alors qu'elle était en jeu, il a donc écopé d'une pénalité`);
                                if (games[room].players.length < 2) {
                                    console.log(`${heure()} [${room}] => La partie est supprimé => [Il ne reste plus qu'un seul joueur]`);
                                    io.to(room).emit('leaderLeaveRoom');
                                    delete rooms[room];
                                    delete games[room];
                                } else {
                                    playerLeavingGame(parseInt(rooms[room].gametype),room,id,pseudo);
                                }
                            }
                            console.log(`${heure()} [${socketId}] => Le joueur a quitté la room [${room}]`);
                        } else {
                            console.log(`${heure()} [${socketId}] => Le joueur n'a pas pu quitter la room [${room}] => [Le joueur n'est pas dans la room]`);
                        }
                    }
                }
            }
        }
    }

// ----------------------- CLASSEMENT

    socket.on('getClassement', async (game) => {
        const classement = await db.all(`SELECT * FROM classement ORDER BY ${game} DESC`);
        socket.emit('seeClassement', classement);
    });

    async function penaltyForLeaving(gameType,playerId) {
        const playerStats = await db.get('SELECT * FROM classement WHERE id=(?)',playerId);
        if (!playerStats) return;
        switch(gameType) {
            case 1: { 
                if(playerStats.bataille > 0) {
                    await db.run('UPDATE classement SET bataille = bataille - 1 WHERE id=(?)',playerId);
                }
                break;
            }
            case 2: {
                if(playerStats.sixQuiPrend > 0) {
                    await db.run('UPDATE classement SET sixQuiPrend = sixQuiPrend - 1 WHERE id=(?)',playerId);
                }
                break;
            }
            case 3: {
                if(playerStats.uno > 0) {
                    await db.run('UPDATE classement SET uno = uno - 1 WHERE id=(?)',playerId);
                }
                break;
            }
            default: break;
        }
    }

// ---------------------- CHAT

    socket.on('chatUpdate',(data) => {
        if(data.playerMessage.length >= 1 && data.playerMessage.length <= 100 && data.roomId && data.pseudo){
            io.to(data.roomId).emit('chatUpdate',{"message":data.playerMessage,"pseudo":data.pseudo,"messageType":0});
            console.log(`${heure()} [${data.pseudo} - ${data.roomId}] => La joueur à envoyé le message suivant => [${data.playerMessage}]`);
        }
    });

// ----------------------- BATAILLE

class CarteBataille {
    constructor(forme, valeur) {
        this.forme = forme;
        this.valeur = valeur;
    }
}

class Bataille {
    constructor(players, gameId, data) {
        if (!data) {
            this.players = players.map(player => ({ id:player.id,pseudo:player.pseudo,cartes:[],pioche:[],isBot:player.isBot,botDifficulty:player.botDifficulty }));
            this.idRoom = gameId;
            this.playedIdCards = [];
            this.playedCards = [];
            this.classement = [];
            this.idListBataille = [];
            this.pioche = this.creerPioche();
            this.distribuerCartes();
            setTimeout(() => {this.handleBotTurn();}, 1000);
        } else {
            const parsedData = JSON.parse(data.gameData);
            this.players = parsedData.players.map(player => ({
                id: player.id,
                pseudo: player.pseudo,
                cartes: parsedData.players.find(joueur => joueur.id === player.id)?.cartes || [],
                pioche: parsedData.players.find(joueur => joueur.id === player.id)?.pioche || [],
                isBot: parsedData.players.find(joueur => joueur.id === player.id)?.isBot || false,
                botDifficulty:parsedData.players.find(joueur => joueur.id === player.id)?.botDifficulty || false
            }));
            this.idRoom = parsedData.idRoom || null;
            this.playedIdCards = parsedData.playedIdCards || [];
            this.playedCards = parsedData.playedCards || [];
            this.classement = parsedData.classement || [];
            this.idListBataille = parsedData.idListBataille || [];
            this.pioche = parsedData.pioche || [];
            setTimeout(() => {this.handleBotTurn();}, 1000);
        }
    }
    
    creerPioche() {
        let pioche = [];
        const formes = ['Coeur', 'Carreau', 'Trefle', 'Pique'];
        for (let forme of formes) {
            for (let i=2;i<15;i++) {
                pioche.push(new CarteBataille(forme, i));
            }
        }
        for (let i=pioche.length-1;i>0;i--) {
            let j = Math.floor(Math.random()*(i+1));
            [pioche[i], pioche[j]] = [pioche[j], pioche[i]];
        }
        return pioche;
    }

    distribuerCartes() {
        let nbJoueurs = this.players.length;
        let nbCartesParJoueur = Math.floor(this.pioche.length / nbJoueurs);
        let indexCarte = 0;
        for (let i = 0; i < nbJoueurs; i++) {
            for (let j = 0; j < nbCartesParJoueur; j++) {
                const carte = this.pioche[indexCarte];
                this.players[i].cartes.push(carte);
                indexCarte++;
            }
        }
        for(let i = 0;i < nbJoueurs;i++) {
            this.players[i].cartes.sort((a,b) => a.valeur - b.valeur);
        }
        this.pioche = [];
    }

    envoieNouveauTourBataille(winnerId) {
        const winnerPseudo = this.players.find(player => player.id === winnerId);
        io.to(this.idRoom).emit('nouveauTourBataille',{ 'players':this.players,'winner':winnerPseudo.pseudo,winnerId,'playedIdCards':this.playedIdCards });
        this.playedIdCards = [];
        this.playedCards = [];
        this.idListBataille = [];
        this.handleBotTurn();
    }

    gererCarteBataille(id,carte,pseudo) {
        const indexJoueur = this.players.findIndex(joueur => joueur.id === id);
        const index = this.players[indexJoueur].cartes.findIndex(carteJoueur => carteJoueur.forme === carte.forme && carteJoueur.valeur === carte.valeur);
        if(this.players.some(player => player.id === id) && !(this.playedIdCards.some(([playerId,_]) => playerId === id) && (index !== -1) && (indexJoueur !== -1))) {
            if(this.idListBataille.length === 0 || (this.idListBataille.length > 0 && this.idListBataille.some(playerId => playerId === id))) {
                this.playedIdCards.push([id,carte,pseudo]);
                this.playedCards.push(carte);
                this.players[indexJoueur].cartes.splice(index,1);
                io.to(this.idRoom).emit('newCardPlayedBataille',{ pseudo,id });
            }
            if(this.playedIdCards.length === this.players.length || this.playedIdCards.length === this.idListBataille.length) {
                this.idListBataille = [];
                this.gererTourBataille();
            }
        }
    }

    async gererTourBataille() {
        this.playedIdCards.sort((a,b) => b[1].valeur - a[1].valeur);
        if(!(this.playedIdCards[0][1].valeur === this.playedIdCards[1][1].valeur)) {
            const winnerId = this.playedIdCards[0][0];
            const index = this.players.findIndex(player => player.id === winnerId);
            if(index !== -1) {
                for(let card of this.playedCards) {
                    this.players[index].pioche.push(card);
                }
            }
            const eliminatedPlayers = this.verifierMainVide();
            if(this.players.length === 1) {
                this.classement.push({ 'pseudo':this.players[0].pseudo,'score':this.players[0].cartes.length+this.players[0].pioche.length,'id':this.players[0].id });
                await endGame(this.idRoom);
            } else {
                if(eliminatedPlayers.length > 0) { io.to(this.idRoom).emit('elimineBataille',eliminatedPlayers); }
                this.envoieNouveauTourBataille(winnerId);
            }
        } else {
            const eliminatedPlayers = this.verifierMainVide();
            if(this.players.length === 1) {
                this.classement.push({ 'pseudo':this.players[0].pseudo,'score':this.players[0].cartes.length+this.players[0].pioche.length,'id':this.players[0].id });
                await endGame(this.idRoom);
            } else {
                if(eliminatedPlayers.length > 0) { 
                    io.to(this.idRoom).emit('elimineBataille',eliminatedPlayers);
                }
                this.envoieBataille();
            }
        }
    }

    async envoieBataille() {
        let index = 0;
        let idCardList = {};
        const max = this.playedIdCards[0][1].valeur;
        while(this.playedIdCards[index] && this.playedIdCards[index][1].valeur === max) {
            const idJoueur = this.playedIdCards[index][0];
            const indexJoueur = this.players.findIndex(player => player.id === idJoueur);
            if(indexJoueur !== -1) {
                const randomCard = this.players[indexJoueur].cartes.splice(Math.floor(Math.random()*this.players[indexJoueur].cartes.length),1)[0];
                if (randomCard) {
                    this.idListBataille.push(idJoueur);
                    idCardList[this.players[indexJoueur].id] = randomCard;
                    this.playedCards.push(randomCard);
                }
            }
            index++;
        }
        const eliminatedPlayers = this.verifierMainVide();
        if(this.players.length === 1) {
            this.classement.push({ 'pseudo':this.players[0].pseudo,'score':this.players[0].cartes.length+this.players[0].pioche.length,'id':this.players[0].id });
            await endGame(this.idRoom);
        } else {
            if(eliminatedPlayers.length > 0) { io.to(this.idRoom).emit('elimineBataille',eliminatedPlayers); }
            this.idListBataille = this.idListBataille.filter(id => !eliminatedPlayers.includes(id));
            if(this.idListBataille.length === 1) {
                const winnerId = this.idListBataille[0];
                const index = this.players.findIndex(player => player.id === winnerId);
                if(index !== -1) {
                    for(let card of this.playedCards) {
                        this.players[index].pioche.push(card);
                    }
                }
                this.envoieNouveauTourBataille(winnerId);
            } else if (this.idListBataille.length === 0) {
                io.to(this.idRoom).emit('nouveauTourBataille',{ 'players':this.players,'winner':'Personne','winnerId':0,'playedIdCards':this.playedIdCards });
            } else {
                const pseudoList = this.idListBataille.map(id => this.players.find(player => player.id === id).pseudo);
                io.to(this.idRoom).emit('nouvelleBataille',{ 'idList':this.idListBataille,idCardList,pseudoList,'players':this.players,'playedIdCards':this.playedIdCards });
                this.playedIdCards = [];
                this.handleBotTurn();
            }
        }
    }


    verifierMainVide() {
        const eliminatedPlayers = [];
        this.players.forEach(player => {
            if (player.cartes.length === 0 && player.pioche.length > 0) {
                player.cartes = [...player.pioche];
                player.pioche = [];
                player.cartes.sort((a, b) => a.valeur - b.valeur);
            }
        });
        this.players = this.players.filter(player => {
            if (player.cartes.length === 0 && player.pioche.length === 0) {
                eliminatedPlayers.push(player.id);
                this.classement.push({ 'pseudo': player.pseudo, 'score': 0, 'id': player.id });
                return false; 
            }
            return true; 
        });
        return eliminatedPlayers;
    }

    handleBotTurn() {
        setTimeout(() => {
            for (let botPlayer of this.players) {
                if (botPlayer.isBot) {
                    if (!(this.playedIdCards.some(([playerId,_]) => playerId === botPlayer.id)) && (this.idListBataille.length === 0 || this.idListBataille.includes(botPlayer.id))) {
                        if (botPlayer.cartes.length > 0) {
                            let mainBot = botPlayer.cartes;
                            let cardToPlay = mainBot[Math.floor(Math.random() * mainBot.length)];
                            this.gererCarteBataille(botPlayer.id,cardToPlay,botPlayer.pseudo);
                        }
                    }
                }
            }
        }, 5000);
    }
}

    socket.on('initialisationBataille',(roomId) => {
        socket.emit('initialisationBataille',(games[roomId].players));
    });

    socket.on('sendCardBataille',(data) => {
        games[data.roomId].gererCarteBataille(data.id,data.carte,data.pseudo);
    });

    socket.on('startBotPlay',(roomId) => {
        games[roomId].handleBotTurn();
    });

// ----------------------- SIX QUI PREND

class SixCartes {
    constructor(valeur) {
        this.valeur = valeur;
        this.nbBoeuf = 0;
    }
}

class SixQuiPrend {
    constructor(players, gameId, data) {
        if (!data) {
            this.players = players.map(player => ({ id:player.id,pseudo:player.pseudo,cartes:[],score:0,isBot:player.isBot,botDifficulty:player.botDifficulty }));
            this.idRoom= gameId;
            this.lines = {};
            this.idToSelectedLine = 0;
            this.playedCards = [];
            this.cartePrise = {};
            for(let player of this.players) { this.cartePrise[player.id] = []; }
            this.pioche = this.creerPioche();
            this.distribuerCartes();
            this.handleBotTurn(0);
        } else {
            const parsedData = JSON.parse(data.gameData);
            this.players = parsedData.players.map(player => ({
                id: player.id,
                pseudo: player.pseudo,
                cartes: parsedData.players.find(joueur => joueur.id === player.id)?.cartes || [],
                score: parsedData.players.find(joueur => joueur.id === player.id)?.score || 0,
                isBot: parsedData.players.find(joueur => joueur.id === player.id)?.isBot || false,
                botDifficulty:parsedData.players.find(joueur => joueur.id === player.id)?.botDifficulty || false
            }));
            this.idRoom = parsedData.idRoom || null;
            this.lines = parsedData.lines || {};
            this.idToSelectedLine = parsedData.idToSelectedLine || 0;
            this.playedCards = parsedData.playedCards || [];
            this.cartePrise = parsedData.cartePrise || {};
            this.pioche = parsedData.pioche || [];
            this.handleBotTurn(0);
        }
    }

    creerPioche() {
        let deck = [];
        for (let i = 1; i < 105; i++) {
            deck.push(new SixCartes(i));
        }
        for (let cartes of deck) {
            if (cartes.valeur % 10 == 5)
                cartes.nbBoeuf += 2;
            if (cartes.valeur % 10 == 0)
                cartes.nbBoeuf += 3;
            if (cartes.valeur % 11 == 0)
                cartes.nbBoeuf += 5;
            if (!(cartes.valeur % 10 == 5 || cartes.valeur % 5 == 0 || cartes.valeur % 11 == 0)) {
                cartes.nbBoeuf += 1;
            } 
        }
        for (let i = deck.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    distribuerCartes() {
        let indexCarte = 0;
        for(let i = 0;i < this.players.length;i++) {
            for(let j = 0;j < 10;j++) {
                this.players[i].cartes.push(this.pioche[indexCarte]);
                indexCarte++;
            }
            this.players[i].cartes.sort((a,b) => a.valeur - b.valeur);
        }
        let tempLines = [this.pioche[indexCarte],this.pioche[indexCarte+1],this.pioche[indexCarte+2],this.pioche[indexCarte+3]]
        tempLines.sort((a,b) => a.valeur - b.valeur);
        for(let i = 1;i < 5;i++) {
            this.lines[i] = [tempLines[i-1]];
            indexCarte++;
        }
        this.pioche = [];
    }

    envoieNouveauTourSix() {
        const delay = this.playedCards.length * 250;
        io.to(this.idRoom).emit('nouveauTourSix',({ 'players':this.players,'lines':this.lines,'cartePrise':this.cartePrise,delay }));
        this.playedCards = [];
        this.handleBotTurn(delay);
    }

    gererCarteSix(id,pseudo,carte) {
        const indexJoueur = this.players.findIndex(player => player.id === id);
        const indexCarte = this.players[indexJoueur].cartes.findIndex(card => card.valeur === carte.valeur);
        if(!(this.playedCards.some(([playerId,_]) => playerId === id)) && (this.idToSelectedLine === 0) && (indexJoueur !== -1) && (indexCarte !== -1)) {
            this.playedCards.push([id,carte,pseudo]);
            this.players[indexJoueur].cartes.splice(indexCarte,1);
            io.to(this.idRoom).emit('newCardPlayedSix',{ id,pseudo });
            if(this.playedCards.length === this.players.length) {
                this.gererTourSix();
            }
        }
    }

    gererLigneSelectionneSix(lineNumber,id) {
        if(this.idToSelectedLine === id) {
            let score = 0;
            for(let i = 0;i < this.lines[lineNumber].length;i++) {
                score += this.lines[lineNumber][i].nbBoeuf;
                this.cartePrise[id].push(this.lines[lineNumber][i]);
            }
            let index = this.players.findIndex(player => player.id === id);
            if(index !== -1) {
                this.players[index].score += score;
            }
            this.lines[lineNumber] = [this.playedCards[0][1]];
            this.playedCards.splice(0,1);
            this.idToSelectedLine = 0;
            this.needChooseLine = false;
            io.to(this.idRoom).emit('messageSix',{ id,'message':`${this.players[index].pseudo} a choisie la ligne ${lineNumber}` });
            this.gererTourSix();
        }
    }

    async gererTourSix() {
        this.playedCards.sort((a,b) => a[1].valeur - b[1].valeur);
        const needChooseLine = this.isNeedChooseLine(this.playedCards[0][1].valeur);
        if(this.playedCards.length === this.players.length) { io.to(this.idRoom).emit('revealedAllCards',this.playedCards) };
        if(!needChooseLine) {
            for(let card of this.playedCards) {
                const line = this.getLineToPlay(card[1]);
                this.playLine(line,card[1],card[0]);
            }
            if(!this.checkVictory()) {
                if(this.players[0].cartes.length === 0) { this.nouvelleRedistribution(); }
                this.envoieNouveauTourSix();
            } else {
                await endGame(this.idRoom);
            }
        } else {
            this.idToSelectedLine = this.playedCards[0][0];
            this.needChooseLine = true;
            const player = this.players.find(player => player.id === this.playedCards[0][0]);
            io.to(this.idRoom).emit('askLine',{ 'id':player.id,'pseudo':player.pseudo });
            if(player.isBot) {
                this.handleBotSelectLine(player.id);
            }
        }
    }

    isNeedChooseLine(valeur) {
        for(let line in this.lines) {
            if(valeur > this.lines[line][this.lines[line].length - 1].valeur) {
                return false;
            }
        }
        return true;
    }

    getLineToPlay(card) {
        let mini = 104;
        let lineToPlay;
        for(let lineNumber in this.lines) {
            let lineLength = this.lines[lineNumber].length - 1;
            let lineContent = this.lines[lineNumber];
            if(card.valeur > lineContent[lineLength].valeur) {
                if(card.valeur - lineContent[lineLength].valeur < mini) {
                    lineToPlay = lineNumber;
                    mini = card.valeur - lineContent[lineLength].valeur;
                }
            }
        }
        return lineToPlay;
    }

    playLine(lineToPlay,card,playerId) {
        this.lines[lineToPlay].push(card);
        if(this.lines[lineToPlay].length === 6) {
            let score = 0;
            for(let i = 0;i < this.lines[lineToPlay].length-1;i++) {
                score += this.lines[lineToPlay][i].nbBoeuf;
                this.cartePrise[playerId].push(this.lines[lineToPlay][i]);
            }
            let index = this.players.findIndex(player => player.id === playerId);
            if(index !== -1) {
                this.players[index].score += score;
            }
            this.lines[lineToPlay] = [card];
        }
    }

    nouvelleRedistribution() {
        for(let joueur of this.players) {
            joueur.cartes=[];
        }
        this.pioche = this.creerPioche();
        this.distribuerCartes();
    }

    checkVictory() {
        return this.players.some(player => player.score >= 66);
    }

    handleBotTurn(delay) {
        setTimeout(() => {
            for(let player of this.players) {
                if(player.isBot) {
                    const card = this.handleBotSelectCard(player.botDifficulty,player);
                    this.gererCarteSix(player.id,player.pseudo,card);
                }
            }
        },(delay + 10000));
    }

    handleBotSelectCard(difficulty,player) {
        let card;
        switch(difficulty) {
            case 'Aleatoire' : {
                card = player.cartes[Math.floor(Math.random() * player.cartes.length)];
                break;
            }

            case 'Carte la plus forte' : {
                card = player.cartes[player.cartes.length - 1];
                break;
            }

            case 'Carte la plus faible' : {
                card = player.cartes[0];
                break;
            }

            case 'NicoTech' : {
                if(player.cartes[0].nbBoeuf <= 1) {
                    for(let line in this.lines) {
                        if(this.lines[line].reduce((a,b) => a + b.nbBoeuf,0) <= 1) {
                            card = player.cartes[0];
                        }
                    }
                }
                if(!card) {
                    card = player.cartes[player.cartes.length - 1];
                }
                break;
            }

            case 'NicoTechV2' : {
                if(player.cartes[0].nbBoeuf <= 1) {
                    for(let line in this.lines) {
                        if(this.lines[line].reduce((a,b) => a + b.nbBoeuf,0) <= 1) {
                            card = player.cartes[0];
                        }
                    }
                } 
                if(!card) {
                    let mini = 104
                    if(Object.values(this.lines).every(arr => arr.length <= 5)) {
                        const sortedLines = Object.keys(this.lines).sort((a, b) => this.lines[a].length - this.lines[b].length);
                        for(let lineIndex of sortedLines) {
                            if(this.lines[lineIndex].length < 5) {
                                for(let carte of player.cartes) {
                                    const carteValue = this.lines[lineIndex][this.lines[lineIndex].length - 1].valeur;
                                    if((carte.valeur > carteValue) && ((carte.valeur - carteValue) < mini)) {
                                        card = carte;
                                        mini = carte.valeur - carteValue;
                                    }
                                }
                            }
                        }
                    }
                }
                if(!card) {
                    card = player.cartes[player.cartes.length - 1];
                }
            }

            case 'BestChoice' : {
                let mini = 104
                if(Object.values(this.lines).every(arr => arr.length <= 5)) {
                    const sortedLines = Object.keys(this.lines).sort((a, b) => this.lines[a].length - this.lines[b].length);
                    for(let lineIndex of sortedLines) {
                        if(this.lines[lineIndex].length < 5) {
                            for(let carte of player.cartes) {
                                const carteValue = this.lines[lineIndex][this.lines[lineIndex].length - 1].valeur;
                                if((carte.valeur > carteValue) && ((carte.valeur - carteValue) < mini)) {
                                    card = carte;
                                    mini = carte.valeur - carteValue;
                                }
                            }
                        }
                    }
                }
                if(!card) {
                    card = player.cartes[player.cartes.length - 1];
                }
            }
            default : { break; }
        }
        return card;
    }

    handleBotSelectLine(id) {
        setTimeout(() => {
            const min = Object.keys(this.lines).reduce((a, b) => (this.lines[a].reduce((c, d) => c + d.nbBoeuf, 0) < this.lines[b].reduce((c, d) => c + d.nbBoeuf, 0)) ? a : b);
            this.gererLigneSelectionneSix(min,id);
        },5000);
    }
}

    socket.on('initialisationSix',(roomId) => {
        socket.emit('initialisationSix',{ 'players':games[roomId].players,'lines':games[roomId].lines,'cartePrise':games[roomId].cartePrise });
    });

    socket.on('sendCardSix',(data) => {
        games[data.roomId].gererCarteSix(data.id,data.pseudo,data.carte);
    });

    socket.on('sendChoosenLine',(data) => {
        games[data.roomId].gererLigneSelectionneSix(data.lineNumber,data.id);
    });

// ----------------------- UNO

class CarteUno {
    constructor (type,valeur,couleur) {
        this.type = type;
        this.valeur = valeur;
        this.couleur = couleur;
    }
}

class Uno {
    constructor (players, gameId, data) {
        if(!data) {
            this.players = players.map(player => ({ id:player.id,pseudo:player.pseudo,cartes:[],score:0,isBot:player.isBot,botDifficulty:player.botDifficulty }));
            this.idRoom = gameId;
            this.colors = ["rouge","bleu","jaune","vert"];
            this.pioche = this.creerPioche();
            this.distribuerCartes();
            this.talon = [this.pioche[this.pioche.length-1]];this.pioche.splice(this.pioche.length-1,1);
            this.indexToPlay = 0;
            this.oldIndex = 0;
            this.sens = '+';
            this.jouerPremierTalon();
        } else {
            const parsedData = JSON.parse(data.gameData);
            this.players = parsedData.players.map(player => ({
                id: player.id,
                pseudo: player.pseudo,
                cartes: parsedData.players.find(joueur => joueur.id === player.id)?.cartes || [],
                score: parsedData.players.find(joueur => joueur.id === player.id)?.score || 0,
                isBot: parsedData.players.find(joueur => joueur.id === player.id)?.isBot || false,
                botDifficulty:parsedData.players.find(joueur => joueur.id === player.id)?.botDifficulty || false
            }));
            this.idRoom = parsedData.idRoom || null;
            this.colors = parsedData.colors || [];
            this.pioche = parsedData.pioche || [];
            this.talon = parsedData.talon || [];
            this.indexToPlay = parsedData.indexToPlay || 0;
            this.oldIndex = parsedData.oldIndex || 0;
            this.sens = parsedData.sens || '+';
        }
    }

    creerPioche() {
        let pioche = [];
        for(let i=0;i<4;i++) {
            pioche.push(new CarteUno("numero",0,this.colors[i]));
            pioche.push(new CarteUno("plusDeux",null,this.colors[i]),new CarteUno("plusDeux",null,this.colors[i]));
            pioche.push(new CarteUno("reverse",null,this.colors[i]),new CarteUno("reverse",null,this.colors[i]));
            pioche.push(new CarteUno("interdit",null,this.colors[i]),new CarteUno("interdit",null,this.colors[i]));
            for(let j=1;j<10;j++) {
                pioche.push(new CarteUno("numero",j,this.colors[i]),new CarteUno("numero",j,this.colors[i]));
            }
        }
        pioche.push(new CarteUno("plusQuatre",null,null),new CarteUno("plusQuatre",null,null),new CarteUno("plusQuatre",null,null),new CarteUno("plusQuatre",null,null));
        pioche.push(new CarteUno("joker",null,null),new CarteUno("joker",null,null),new CarteUno("joker",null,null),new CarteUno("joker",null,null));
        for(let i=pioche.length-1;i>0;i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pioche[i], pioche[j]] = [pioche[j], pioche[i]];
        }
        return pioche;
    }

    distribuerCartes() {
        for(let i=0;i<this.players.length;i++) {
            for(let j=0;j<7;j++) {
                this.players[i].cartes.push(this.pioche[0]);
                this.pioche.splice(0,1);
            }
        }
    }

    jouerPremierTalon() {
        switch(this.talon[0].type) {
            case 'numero': {
                break;
            }
            case 'plusDeux': {
                this.piocherCarte(this.indexToPlay);
                this.piocherCarte(this.indexToPlay);
                this.incrementerIndexToPlay();
                break;
            }
            case 'reverse': {
                if(this.players.length > 2) {
                    this.sens === '+' ? this.sens = '-' : this.sens = '+';
                    this.incrementerIndexToPlay();
                }
                break;
            }
            case 'interdit': {
                this.incrementerIndexToPlay();
                break;
            }
            case 'plusQuatre' : {
                this.piocherCarte(this.indexToPlay);
                this.piocherCarte(this.indexToPlay);
                this.piocherCarte(this.indexToPlay);
                this.piocherCarte(this.indexToPlay);
                this.incrementerIndexToPlay();
                this.talon[0].couleur = this.colors[Math.floor(Math.random()*4)];
                break;
            }
            case 'joker' : {
                this.talon[0].couleur = this.colors[Math.floor(Math.random()*4)];
                break;
            }
            default: break;
        }
        this.handleBotTurn();
    }

    gererTourUno(card,couleur,id) {
        if(this.players[this.indexToPlay].id === id) {
            if(card.type !== 'pioche') {
                if(card.type === 'plusQuatre' || card.type === 'joker') {
                    card.couleur = couleur;
                }
                this.talon.push(card);
            }
            let indexCarte = this.players[this.indexToPlay].cartes.findIndex(carte => carte.type === card.type && carte.valeur === card.valeur && (carte.couleur ===  card.couleur || card.couleur === couleur));
            if(indexCarte !== -1) {
                this.players[this.indexToPlay].cartes.splice(indexCarte,1);
            }
            if(this.players[this.indexToPlay].cartes.length === 0) {
                this.finTour();
            } else {
                switch(card.type) {
                    case 'numero': {
                        this.incrementerIndexToPlay();
                        this.envoieNouveauTourUno();
                        break;
                    }
                    case 'plusDeux': {
                        this.incrementerIndexToPlay();
                        this.piocherCarte(this.indexToPlay);
                        this.piocherCarte(this.indexToPlay);
                        this.incrementerIndexToPlay();
                        this.envoieNouveauTourUno();
                        break;
                    }
                    case 'reverse': {
                        if(this.players.length > 2) {
                            this.sens === '+' ? this.sens = '-' : this.sens = '+';
                            this.incrementerIndexToPlay();
                        }
                        this.envoieNouveauTourUno();
                        break;
                    }
                    case 'interdit': {
                        this.incrementerIndexToPlay();
                        this.incrementerIndexToPlay();
                        this.envoieNouveauTourUno();
                        break;
                    }
                    case 'plusQuatre' : {
                        this.oldIndex = this.indexToPlay;
                        this.incrementerIndexToPlay();
                        io.to(this.idRoom).emit('contestPlusQuatre',{ id:this.players[this.indexToPlay].id,pseudo:this.players[this.indexToPlay].pseudo,oldIndex:this.players[this.oldIndex].pseudo });
                        this.handleBotContestPlusQuarte();
                        break;
                    }
                    case 'joker' : {
                        this.incrementerIndexToPlay();
                        this.envoieNouveauTourUno();
                        break;
                    }
                    case 'pioche' : {
                        if(this.pioche.length === 0) {
                            const nouveauTalon = this.talon.pop();
                            this.pioche = this.talon;
                            for(let i=this.pioche.length-1;i>0;i--) {
                                const j = Math.floor(Math.random() * (i + 1));
                                [this.pioche[i], this.pioche[j]] = [this.pioche[j], this.pioche[i]];
                            }
                            this.talon = [nouveauTalon];
                        }
                        const isPlayable = this.piochePeutEtreJouee();
                        if(isPlayable === 'noMorePioche') {
                            io.to(this.idRoom).emit('messageUno',{ message:`${this.players[this.indexToPlay].pseudo} passe son tour car il n'y a plus de pioche` });
                            this.incrementerIndexToPlay();
                            this.envoieNouveauTourUno();
                        } else if(isPlayable) {
                            let newcard = this.pioche.pop();
                            io.to(this.idRoom).emit('pioche',{ 'id':this.players[this.indexToPlay].id,'carte':newcard });
                            this.handleBotPlayPioche(newcard);
                        } else {
                            this.piocherCarte(this.indexToPlay);
                            io.to(this.idRoom).emit('messageUno',{ message:`${this.players[this.indexToPlay].pseudo} pioche une carte` });
                            this.incrementerIndexToPlay();
                            this.envoieNouveauTourUno();
                        }
                        break;
                    }
                    default: break;
                }
            }
        }
    }

    incrementerIndexToPlay() {
        if(this.sens === '+') {
            this.indexToPlay = (this.indexToPlay+1) % this.players.length;
        } else {
            if(this.indexToPlay === 0) {
                this.indexToPlay = this.players.length;
            }
            this.indexToPlay--;
        }
    }

    nextToPlay() {
        let nextToPlay = this.indexToPlay;
        if(this.sens === '+') {
            nextToPlay = (nextToPlay+1) % this.players.length;
        } else {
            if(nextToPlay === 0) {
                nextToPlay = this.players.length;
            }
            nextToPlay--;
        }
        return this.players[nextToPlay].pseudo;
    }

    envoieNouveauTourUno() {
        const player = this.players[this.indexToPlay]; 
        const nextPlayer = this.nextToPlay();    
        io.to(this.idRoom).emit('nouveauTourUno',{ 'id':player.id,'pseudo':player.pseudo,'players':this.players,'talon':this.talon[(this.talon.length)-1],'nextPlayer':nextPlayer});
        this.handleBotTurn();
    }

    piocherCarte(index) {
        if(this.pioche.length === 0) {
            const nouveauTalon = this.talon.pop();
            this.pioche = this.talon;
            for(let i=this.pioche.length-1;i>0;i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.pioche[i], this.pioche[j]] = [this.pioche[j], this.pioche[i]];
            }
            this.talon = [nouveauTalon];
        }
        const newcard = this.pioche.pop();
        if(newcard) {
            this.players[index].cartes.push(newcard);
        }
    }

    piocherCartePioche(carte) {
        this.players[this.indexToPlay].cartes.push(carte);
        this.incrementerIndexToPlay();
        this.envoieNouveauTourUno();
    }

    piochePeutEtreJouee() {
        let carte = this.pioche[this.pioche.length - 1];
        if(!carte) { return 'noMorePioche'; }
        return (((carte.couleur === this.talon[this.talon.length-1].couleur || carte.valeur === this.talon[this.talon.length-1].valeur) && ((carte.couleur === this.talon[this.talon.length-1].couleur) ? true : carte.type === this.talon[this.talon.length-1].type)) || (carte.type === "joker" || carte.type === "plusQuatre"));
    }

    contestPlusQuatre() {
        let canOldPlayerPlay = false;
        for(let carte of this.players[this.oldIndex].cartes) {
            if(carte.type != "plusQuatre" && ((carte.couleur === this.talon[this.talon.length-2].couleur || carte.valeur === this.talon[this.talon.length-2].valeur) && ((carte.couleur === this.talon[this.talon.length-2].couleur) ? true : carte.type === this.talon[this.talon.length-2].type)) || (carte.type === "joker")) {
                canOldPlayerPlay = true;
                break;
            }
        }
        if(canOldPlayerPlay) {
            io.to(this.idRoom).emit('messageUno',{ message:`${this.players[this.indexToPlay].pseudo} conteste le +4 de ${this.players[this.oldIndex].pseudo} et il gagne. ${this.players[this.oldIndex].pseudo} prend donc 4 cartes` });
            this.piocherCarte(this.oldIndex);
            this.piocherCarte(this.oldIndex);
            this.piocherCarte(this.oldIndex);
            this.piocherCarte(this.oldIndex);
            this.envoieNouveauTourUno();
        } else {
            io.to(this.idRoom).emit('messageUno',{ message:`${this.players[this.indexToPlay].pseudo} conteste le +4 de ${this.players[this.oldIndex].pseudo} et il perd. ${this.players[this.indexToPlay].pseudo} prend donc 6 cartes ` });
            this.piocherCarte(this.indexToPlay);
            this.piocherCarte(this.indexToPlay);
            this.piocherCarte(this.indexToPlay);
            this.piocherCarte(this.indexToPlay);
            this.piocherCarte(this.indexToPlay);
            this.piocherCarte(this.indexToPlay);
            this.incrementerIndexToPlay();
            this.envoieNouveauTourUno();
        }
        this.oldIndex = 0;
    }

    noContestPlusQuatre() {
        io.to(this.idRoom).emit('messageUno',{ message:`${this.players[this.indexToPlay].pseudo} ne conteste pas le +4, il pioche donc 4 cartes` });
        this.piocherCarte(this.indexToPlay);
        this.piocherCarte(this.indexToPlay);
        this.piocherCarte(this.indexToPlay);
        this.piocherCarte(this.indexToPlay);
        this.incrementerIndexToPlay();
        this.envoieNouveauTourUno();
    }

    async finTour() {
        let score = 0;
        let scoreCarte;
        for(let index in this.players) {
            if(index !== this.indexToPlay) {
                for(let carte of this.players[index].cartes) {
                    scoreCarte = this.calculerScoreCartes(carte);
                    score += scoreCarte;
                }
            }
        }
        this.players[this.indexToPlay].score += score;
        if(this.checkVictory()) {
            await endGame(this.idRoom);
        } else {
            io.to(this.idRoom).emit('messageUno',{ message:`${this.players[this.indexToPlay].pseudo} a remporté la manche et il gagne ${score} points. Une nouvelle manche débute` });
            for(let player of this.players) {
                player.cartes = [];
            }
            this.pioche = this.creerPioche();
            this.distribuerCartes();
            this.talon = [this.pioche[this.pioche.length-1]];this.pioche.splice(this.pioche.length-1,1);
            this.indexToPlay = 0;
            this.oldIndex = 0;
            this.sens = '+';
            this.jouerPremierTalon();
            this.envoieNouveauTourUno();
        }
    }

    calculerScoreCartes(carte) {
        if(carte.type !== 'numero') {
            return 20;
        } else {
            return parseInt(carte.valeur);
        }
    }

    checkVictory() {
        return this.players.some(player => player.score >= 500);
    }

    handleBotTurn() {
        setTimeout(() => {
            if(this.players[this.indexToPlay].isBot) {
                const carteJouable = [];
                for(let carte of this.players[this.indexToPlay].cartes) {
                    if (carte) {
                        const isPlayable = (((carte.couleur === this.talon[this.talon.length-1].couleur || carte.valeur === this.talon[this.talon.length-1].valeur) && ((carte.couleur === this.talon[this.talon.length-1].couleur) ? true : carte.type === this.talon[this.talon.length-1].type)) || (carte.type === "joker" || carte.type === "plusQuatre"));
                        if(isPlayable) {
                            carteJouable.push(carte);
                        }
                    }
                }
                if(carteJouable.length > 0) {
                    let couleur = null;
                    const carte = carteJouable[Math.floor(Math.random() * carteJouable.length)];
                    if(carte.type === "joker" || carte.type === "plusQuatre") {
                        couleur = this.colors[Math.floor(Math.random() * this.colors.length)];
                    }
                    this.gererTourUno(carte,couleur,this.players[this.indexToPlay].id);
                } else {
                    const carte = {type : 'pioche', valeur : null, couleur : null};
                    this.gererTourUno(carte,couleur,this.players[this.indexToPlay].id);
                }
            }
        },5000);
    }

    handleBotPlayPioche(newcard) {
        setTimeout(() => {
            if(this.players[this.indexToPlay].isBot) {
                let couleur = null;
                if(newcard.type === "joker" || newcard.type === "plusQuatre") {
                    couleur = this.colors[Math.floor(Math.random() * this.colors.length)];
                }
                this.gererTourUno(newcard,couleur,this.players[this.indexToPlay].id);
            }
        },5000);
    }

    handleBotContestPlusQuarte() {
        setTimeout(() => {
            if(this.players[this.indexToPlay].isBot) {
                const contest = Math.random() < 0.5;
                if(contest) {
                    this.contestPlusQuatre();
                } else {
                    this.noContestPlusQuatre();
                }
            }
        },5000);
    }
}

    socket.on('initialisationUno',(roomId) => {
        const player = games[roomId].players[games[roomId].indexToPlay];
        const talon = games[roomId].talon[(games[roomId].talon.length)-1];
        const nextPlayer = games[roomId].nextToPlay();
        socket.emit('nouveauTourUno', { 'id':player.id,'pseudo':player.pseudo,'players':games[roomId].players,talon,nextPlayer } );
    });

    socket.on('sendCardUno',(data) => {
        data.couleur !== null ? couleur = data.couleur : null;
        games[data.roomId].gererTourUno(data.card,couleur,data.id);
    });

    socket.on('contestPlusQuatre',(data) => {
        data.a ? games[data.roomId].contestPlusQuatre() : games[data.roomId].noContestPlusQuatre();
    });

    socket.on('pioche',(data) => {
        if(data.a) {
            games[data.roomId].piocherCartePioche(data.carte);
        } else {
            socket.emit('joueePioche',(data.carte));
        }
    });

// ----------------------- FIN PARTIE

    async function endGame(roomId) {
        const gameType = parseInt(rooms[roomId].gametype);
        let classement;
        switch(gameType) {
            case 1: {
                classement = games[roomId].classement;
                classement.reverse();
                try {
                    await db.run('UPDATE classement SET bataille = bataille + 1 WHERE id=(?)',classement[0].id);
                } catch(e) {
                    console.log(`${heure()} Erreur lors de l'insertion dans la BDD => [${e}]`);
                }
                break;
            }
            case 2: {
                classement = games[roomId].players.sort((a, b) => a.score - b.score);
                try {
                    const scoreGagnant = classement[0].score;
                    for(let joueur of classement) {
                        if(joueur.score == scoreGagnant) {
                            await db.run('UPDATE classement SET sixQuiPrend = sixQuiPrend + 1 WHERE id=(?)',joueur.id);
                        }
                        await db.run('UPDATE classement SET nombrePartieJoueeSixQuiPrend = nombrePartieJoueeSixQuiPrend + 1 WHERE id=(?)',joueur.id);
                        await db.run('UPDATE classement SET scoreCumuleSixQuiPrend = scoreCumuleSixQuiPrend + (?) WHERE id=(?)',joueur.score,joueur.id);
                        const nombrePartieJouee = await db.get('SELECT nombrePartieJoueeSixQuiPrend FROM classement WHERE id=(?)',joueur.id);
                        const scoreCumule = await db.get('SELECT scoreCumuleSixQuiPrend FROM classement WHERE id=(?)',joueur.id);
                        const moyenne = (scoreCumule.scoreCumuleSixQuiPrend / nombrePartieJouee.nombrePartieJoueeSixQuiPrend);
                        await db.run('UPDATE classement SET moyenneSixQuiPrend = ROUND((?)) WHERE id=(?)',moyenne,joueur.id);
                    }
                } catch(e) {
                    console.log(`${heure()} Erreur lors de l'insertion dans la BDD => [${e}]`);
                }
                break;
            }
            case 3: {
                classement = games[roomId].players.sort((a, b) => b.score - a.score);
                try {
                    await db.run('UPDATE classement SET uno = uno + 1 WHERE id=(?)',classement[0].id);
                    for(let joueur of classement) {
                        await db.run('UPDATE classement SET nombrePartieJoueeUno = nombrePartieJoueeUno + 1 WHERE id=(?)',joueur.id);
                        await db.run('UPDATE classement SET scoreCumuleUno = scoreCumuleUno + (?) WHERE id=(?)',joueur.score,joueur.id);
                        const nombrePartieJouee = await db.get('SELECT nombrePartieJoueeUno FROM classement WHERE id=(?)',joueur.id);
                        const scoreCumule = await db.get('SELECT scoreCumuleUno FROM classement WHERE id=(?)',joueur.id);
                        const moyenne = (scoreCumule.scoreCumuleUno / nombrePartieJouee.nombrePartieJoueeUno);
                        await db.run('UPDATE classement SET moyenneUno = ROUND((?)) WHERE id=(?)',moyenne,joueur.id);
                    }
                } catch(e) {
                    console.log(`${heure()} Erreur lors de l'insertion dans la BDD => [${e}]`);
                }
                break;
            }
            default: break;
        }
        delete rooms[roomId];
        delete games[roomId];
        io.to(roomId).emit('gameOver',classement);
    }
});