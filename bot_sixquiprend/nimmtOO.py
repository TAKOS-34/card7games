from players.humanPlayer import HumanPlayer
from game.nimmtGame import NimmtGame     
from players.strategies import *
from players.botPlayer import BotPlayer

def interactiveRun():
    print("Bienvenue sur le jeu 6 qui prend !")
    while True:
        try:
            num_players = int(input("Combien de joueurs ? "))
            players=[]
            for i in range(num_players):
                name=input("Nom du joueur : ")
                strategy=input("Stratégie du joueur  : \n[1] : Random\n[2] : PlusPetit\n[3] : PlusGrand\n[4] : Echantillonage\n[5] : Humain\n")
                if strategy == "1":
                    players.append(BotPlayer(name,RandomStrategy()))
                elif strategy == "2":
                    players.append(BotPlayer(name,plusPetit()))
                elif strategy == "3":
                    players.append(BotPlayer(name,plusGrand()))
                elif strategy == "4":
                    players.append(BotPlayer(name,Echantillonage()))
                elif strategy == "5":
                    players.append(HumanPlayer(name))
            game=NimmtGame(players)
            scores, winners=game.play()

            print("La partie est terminée!")
            print("Scores finaux :")
            for playername, score in scores.items(): 
                print(f"Joueur {playername} : {score} points")
            s=" ".join([player.name for player in winners])
            print("Vainqueurs(s) : ",s," !")
            break
        except ValueError:
            print("Veuillez entrer un nombre entier.")

if __name__ == "__main__":
    interactiveRun()