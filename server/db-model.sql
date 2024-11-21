CREATE TABLE account (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(24) UNIQUE NOT NULL,
    pseudo VARCHAR(24) UNIQUE NOT NULL,
    password BINARY(60) NOT NULL
);

CREATE TABLE classement (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pseudo VARCHAR(24) NOT NULL,
    bataille INTEGER DEFAULT 0,
    sixQuiPrend INTEGER DEFAULT 0,
    scoreCumuleSixQuiPrend INTEGER DEFAULT 0,
    nombrePartieJoueeSixQuiPrend INT DEFAULT 0,
    moyenneSixQuiPrend FLOAT DEFAULT 0,
    uno INTEGER DEFAULT 0,
    scoreCumuleUno INTEGER DEFAULT 0,
    nombrePartieJoueeUno INT DEFAULT 0,
    moyenneUno FLOAT DEFAULT 0,
    FOREIGN KEY (id) REFERENCES account(id)
);

CREATE TABLE games (
    gameId VARCHAR(16) PRIMARY KEY,
    gameLeader INTEGER NOT NULL,
    gameType INTEGER NOT NULL,
    gameName VARCHAR(24) NOT NULL,
    gameData TEXT
);

-- INSERT INTO account (username, pseudo ,password) VALUES ('takos34000', 'takos34000', 'takos34000');
-- INSERT INTO classement (pseudo) VALUES ('takos34000');

-- INSERT INTO account (username, pseudo ,password) VALUES ('staily34000', 'staily34000', 'staily34000');
-- INSERT INTO classement (pseudo) VALUES ('staily34000');

-- INSERT INTO account (username, pseudo ,password) VALUES ('drowie34000', 'drowie34000', 'drowie34000');
-- INSERT INTO classement (pseudo) VALUES ('drowie34000');

-- INSERT INTO account (username, pseudo ,password) VALUES ('mathox34000', 'mathox34000', 'mathox34000');
-- INSERT INTO classement (pseudo) VALUES ('mathox34000');