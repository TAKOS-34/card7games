from players.humanPlayer import HumanPlayer
from game.nimmtGame import NimmtGame     
from players.strategies import *
from players.botPlayer import BotPlayer

def interactiveRun(num_players, strategy, nombre_game):
    print("Bienvenue sur le jeu 6 qui prend !")
    result = {}

    for i in range(num_players):
        name = "Bot " + str(i)
        if name not in result:
            result[name] = {'victoires': 0, 'parties_jouees': 0}  # Initialisation des statistiques pour chaque joueur

    total_victoires_globales = 0

    for _ in range(nombre_game):
        players = []
        for i in range(num_players):
            name = "Bot " + str(i)
            if strategy == "1":
                players.append(BotPlayer(name, RandomStrategy()))
            elif strategy == "2":
                players.append(BotPlayer(name, plusPetit()))
            elif strategy == "3":
                players.append(BotPlayer(name, plusGrand()))

        game = NimmtGame(players)
        scores, winners = game.play()

        for winner in winners:
            result[winner.name]['victoires'] += 1


        # Mettre à jour le nombre total de parties jouées pour chaque joueur
        for player_stats in result.values():
            player_stats['parties_jouees'] += 1

    print("Statistiques finales :")
    for player, stats in result.items():
        print(f"{player} : {stats['victoires']} victoire(s) sur {stats['parties_jouees']} parties jouées")
        total_victoires_globales += stats['victoires']  # Ajout des victoires du joueur au total des victoires globales

    print(f"Nombre total de victoires globales : {total_victoires_globales}")

if __name__ == "__main__":
    num_players = int(input("Combien de joueurs ? "))
    strategy = input("Stratégie du joueur  : \n[1] : Random\n[2] : PlusPetit\n[3] : PlusGrand\n")
    nombre_game = int(input("Nombre de parties à exécuter : "))

    interactiveRun(num_players, strategy, nombre_game)
