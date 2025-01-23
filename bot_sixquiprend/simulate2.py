from game.nimmtGame import NimmtGame
from players.botPlayer import BotPlayer
from players.strategies import *
from collections import defaultdict
import copy
import matplotlib.pyplot as plt

def simulate_head_to_head(num_games):
	#bot1 = BotPlayer("Echantillonage", Echantillonage())
	bot2 = BotPlayer("RandomStrategy", RandomStrategy())
	bot4 = BotPlayer("plusGrand", plusGrand())
	bot5 = BotPlayer("plusPetit", plusPetit())
	#bot6 = BotPlayer("MinMaxLike", MinMaxLike())
	bot7 = BotPlayer("Metissage", Metissage())
	bot8 = BotPlayer("BestChoice", BestChoice())
	
	players = [bot2, bot4, bot5,bot7,bot8]

	nb_win = {bot.name: 0 for bot in players}

	for game_index in range(1, num_games + 1):
		print(f"Partie {game_index} en cours...")

		# Initialisation du jeu
		game = NimmtGame(copy.deepcopy(players))

		# Lancement de la partie
		scores, _ = game.play()
		winner = None
		best = float('inf')
		for player, score in scores.items():
			if score < best:
				best = score
				winner = player
		nb_win[winner]+=1

		print(f"Partie {game_index} terminée.")

	print("\nRésultats du match :")
	for player, wins in nb_win.items():
		print(f"{player} a gagné {wins} fois ({round((wins/num_games)*100,2)} %)")
		
	plot_results(nb_win)

def plot_results(nb_win):
    players = list(nb_win.keys())
    wins = list(nb_win.values())
    combined_data = list(zip(players, wins))
    combined_data.sort(key=lambda x: x[1])
    players, wins = zip(*combined_data)
    players = [f'{player} ({win} - {round((win / sum(wins)) * 100, 2)}%)' for player, win in zip(players, wins)]
    plt.bar(players, wins, color='skyblue')
    plt.xlabel('Stratégie')
    plt.ylabel('Nombre de parties gagnées')
    plt.title('Résultats sur '+str(sum(wins))+' parties')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.show()



if __name__ == "__main__":
	num_games = int(input("Combien de parties ? "))
	simulate_head_to_head(num_games)