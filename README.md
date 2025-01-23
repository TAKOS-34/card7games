# CARD GAMES - GROUPE 7

## Comment lancer le serveur :

Pour mettre en place l'environnement du serveur, suivez ces étapes :

1. **Installation des dépendances** :
   - Ouvrez un terminal à la racine du projet.
   - Exécutez `npm i` pour installer les dépendances nécessaires.
   - Ouvrez un second terminal et naviguez vers le dossier '/server', puis exécutez à nouveau `npm i`.

2. **Lancement du serveur** :
   - Dans le terminal à la racine, lancez le côté client React avec la commande `npm start`.
   - Dans le second terminal situé dans "/server", lancez le serveur Express et Socket.io avec `npm start`.

## Base de données :

Comptes prédéfinis pour une connexion rapide :

- **takos34000** : takos34000
- **staily34000** : staily34000
- **drowie34000** : drowie34000
- **mathox34000** : mathox34000

## Fonctionnalités du site :

- **Connexion et inscription** : Accès restreint aux pages sans authentification.
- **Accueil** : Sélectionnez ou rejoignez une room parmi celles disponibles. La liste des rooms s'actualise automatiquement.
- **Votre Profil** : Modifiez votre mot de passe, pseudo ou supprimez votre compte.
- **Classement** : Consultez le classement des joueurs par nombre de victoires.
- **Déconnexion** : Déconnectez-vous et déconnecte instantanément toutes les autres sessions actives sur votre compte.
- **Création et gestion de rooms** : Rejoignez ou créez une room, choisissez le nombre de joueurs, le type de jeu, et générez un ID unique pour votre room.
- **Discussion en room & en jeu** : Communiquez avec les autres joueurs via le chat.
- **Gestion des parties** : Le leader peut mettre la partie en pause et la relancer ultérieurement, garantissant une reprise du jeu au même point d'interruption.

## Jeu disponible sur le site

Le site propose trois jeux pour 2 à 10 joueurs :

- La Bataille ouverte
- Le Six qui prend
- Le Uno

Chaque jeu dispose d'un bouton "Règles" pour consulter les spécificités de chaque jeu.

## BONUS - Serveur pour tester le projet

- **Accès en ligne** : Le projet est accessible à l'adresse `https://card7games.fr`.
- **Bots disponibles** : Vous trouverez dans notre projet des bots pour chacun des jeux, que vous pouvez ajouter depuis la salle lorsque vous êtes le chef.
