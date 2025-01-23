from players.player import Player
from game.card import Card
from game.nimmtGame import NimmtGame
from abc import ABC, abstractmethod
import random
import copy
from collections import defaultdict

class Strategy:

    @abstractmethod
    def getCard(self, player,game):
        pass

    def getLine(self, game):
        pass


class RandomStrategy(Strategy):
    def getCard(self, player,game):
        """
        Permet d'obtenir la carte à jouer.
        :return: La réponse du joueur.
        """    
        while True:
            try:
                cardChoose = random.choice(player.hand)
                #print("Le chiffre sélectionné aléatoirement dans la liste est :", cardChoose)
                if cardChoose.value <= 0:
                    raise ValueError
                return cardChoose.value
            except ValueError:
                self.info("Veuillez entrer un nombre entier positif.") 

    def __repr__(self):
        return "BetterRandomStrategy"

    def getLine(self, game):
        """
        permet d'obtenir la ligne à enlever quand la carte jouée était plus petite

        :param game: le jeu en cours
        :return: la ligne à enlever
        """
        while True:
            try:
                nbTeteBoeuf = []
                for row in game.table:
                    nbTeteBoeuf.append(game.total_cows(row))
                line = nbTeteBoeuf.index(min(nbTeteBoeuf))+1
                #print("La ligne avec le moins de têtes de bœuf est :", line)
                if 1 <= line <= 4:
                    return line
                else:
                    self.info("Vous devez choisir une ligne entre 1 et 4")
            except ValueError:
                self.info("Veuillez entrer un nombre entier entre 1 et 4.")
class plusPetit(Strategy):

    def getCard(self,player,game):    
        """
        Permet d'obtenir la carte à jouer.

        :return: La réponse du joueur.
        """    
        while True:
            try:
                plusPetiteCarte = min(player.hand)
                #print("Le chiffre sélectionné (plus petite carte) dans la liste est :", plusPetiteCarte)
                if plusPetiteCarte.value <= 0:
                    raise ValueError
                return plusPetiteCarte.value
            except ValueError:
                self.info("Veuillez entrer un nombre entier positif.")


    def getLine(self, game):
        """
        permet d'obtenir la ligne à enlever quand la carte jouée était plus petite

        :param game: le jeu en cours
        :return: la ligne à enlever
        """
        while True:
            try:
                nbTeteBoeuf = []
                for row in game.table:
                    nbTeteBoeuf.append(game.total_cows(row))
                line = nbTeteBoeuf.index(min(nbTeteBoeuf))+1
                #print("La ligne avec le moins de têtes de bœuf est :", line)
                if 1 <= line <= 4:
                    return line
                else:
                    self.info("Vous devez choisir une ligne entre 1 et 4")
            except ValueError:
                self.info("Veuillez entrer un nombre entier entre 1 et 4.")

    def __repr__(self):
        return "plusPetit"

class plusGrand(Strategy):
    def getCard(self,player,game):    
        """
        Permet d'obtenir la carte à jouer.

        :return: La réponse du joueur.
        """    
        while True:
            try:
                plusGrandCarte = max(player.hand)
                #print("Le chiffre sélectionné (plus grande carte) dans la liste est :", plusGrandCarte)
                if plusGrandCarte.value <= 0:
                    raise ValueError
                return plusGrandCarte.value
            except ValueError:
                self.info("Veuillez entrer un nombre entier positif.")

    def getLine(self, game):
        """
        permet d'obtenir la ligne à enlever quand la carte jouée était plus petite

        :param game: le jeu en cours
        :return: la ligne à enlever
        """
        while True:
            try:
                nbTeteBoeuf = []
                for row in game.table:
                    nbTeteBoeuf.append(game.total_cows(row))
                line = nbTeteBoeuf.index(min(nbTeteBoeuf))+1
                #print("La ligne avec le moins de têtes de bœuf est :", line)
                if 1 <= line <= 4:
                    return line
                else:
                    self.info("Vous devez choisir une ligne entre 1 et 4")
            except ValueError:
                self.info("Veuillez entrer un nombre entier entre 1 et 4.")

    def __repr__(self):
        return "plusGrand"


class Echantillonage(Strategy):

    def simulate_round(self, game, playerHand,player,k,nombreTourTest):
        """
        Simule un tour de jeu avec une carte donnée pour estimer le nombre de têtes de bœuf qu'elle rapporte.

        :param game: Le jeu en cours.
        :param cloneHand: La main du joueur.
        :return: Le nombre estimé de têtes de bœuf que la carte rapporte.
        """
        nombreTourSimule = nombreTourTest
        cloneGame = copy.deepcopy(game)
        cloneHand=playerHand.copy()
        cloneAlreadyPlayedCards = cloneGame.alreadyPlayedCards

        cartesImpossible = cloneAlreadyPlayedCards + [card for card in cloneHand]
        cartesPossible = [Card(i) for i in range(1, 105) if Card(i) not in cartesImpossible]

        ensembleE = []
        scores_cartes = {}

        for _ in range(nombreTourSimule):
            plays = []
            for players in cloneGame.players:
                if players != player:
                    chooseCard = random.choice(cartesPossible)
                    while chooseCard in ensembleE:
                        chooseCard = random.choice(cartesPossible)
                    ensembleE.append(chooseCard)
                    plays.append((players, chooseCard))

            if nombreTourSimule == nombreTourTest:
                card = cloneHand[k]
            else:
                card = random.choice(cloneHand)

            plays.append((player, card))
            cloneHand.remove(card)
            plays.sort(key=lambda x: x[1])
            cloneGame.update_table(plays)
            scores_cartes[card.value] = player.score
            player.score=0
            nombreTourSimule-=1
        return(scores_cartes)

    def getCard(self,player,game):    
        """
        Permet d'obtenir la carte à jouer.

        :return: La réponse du joueur.
        """    
        while True:
            try:
                playerCopy = copy.deepcopy(player)
                total_scores = {}
                div=0
                for _ in range(25):
                    for k in range(len(player.hand)):
                        scores_cartes = self.simulate_round(game, player.hand, playerCopy,k,len(player.hand))
                        for card, score in scores_cartes.items():
                            if card not in total_scores:
                                total_scores[card] = score
                            else:
                                total_scores[card] += score
                        div += 1
                average_scores = {card: score / div for card, score in total_scores.items()}
                #print(average_scores)
                bestCard = min(average_scores, key=average_scores.get)
                # print("-----------------------")
                # print("Le chiffre sélectionné (plus grande carte) dans la liste est :", bestCard)
                # print("VOUS AVEZ JOUE CA DCP GG", bestCard)
                # print("-----------------------")

                if bestCard <= 0:
                    raise ValueError
                return bestCard
            except ValueError:
                self.info("Veuillez entrer un nombre entier positif.")

    def getLine(self, game):
        """
        permet d'obtenir la ligne à enlever quand la carte jouée était plus petite

        :param game: le jeu en cours
        :return: la ligne à enlever
        """
        while True:
            try:
                nbTeteBoeuf = []
                for row in game.table:
                    nbTeteBoeuf.append(game.total_cows(row))
                line = nbTeteBoeuf.index(min(nbTeteBoeuf))+1
                #print("La ligne avec le moins de têtes de bœuf est :", line)
                if 1 <= line <= 4:
                    return line
                else:
                    self.info("Vous devez choisir une ligne entre 1 et 4")
            except ValueError:
                self.info("Veuillez entrer un nombre entier entre 1 et 4.")

    def __repr__(self):
        return "Echantillonage"


class NicoTech(Strategy):
    def getCard(self,player,game):    
        """
        Permet d'obtenir la carte à jouer.

        :return: La réponse du joueur.
        """    
        while True:
            try:
                bestCard = None
                if player.hand[0].cowsNb <=1 :
                    for ligne in game.table:
                        if game.total_cows(ligne) <=1:
                            bestCard = player.hand[0]

                if bestCard is None:
                    bestCard = max(player.hand)

                #print("Le chiffre sélectionné (plus grande carte) dans la liste est :", bestCard)
                if bestCard.value <= 0:
                    raise ValueError
                return bestCard.value
            except ValueError:
                self.info("Veuillez entrer un nombre entier positif.")

    def getLine(self, game):
        """
        permet d'obtenir la ligne à enlever quand la carte jouée était plus petite

        :param game: le jeu en cours
        :return: la ligne à enlever
        """
        while True:
            try:
                nbTeteBoeuf = []
                for row in game.table:
                    nbTeteBoeuf.append(game.total_cows(row))
                line = nbTeteBoeuf.index(min(nbTeteBoeuf))+1
                #print("La ligne avec le moins de têtes de bœuf est :", line)
                if 1 <= line <= 4:
                    return line
                else:
                    self.info("Vous devez choisir une ligne entre 1 et 4")
            except ValueError:
                self.info("Veuillez entrer un nombre entier entre 1 et 4.")

    def __repr__(self):
        return "NicoTech"


class Metissage(Strategy):
    def getCard(self,player,game):    
        """
        Permet d'obtenir la carte à jouer.

        :return: La réponse du joueur.
        """    
        while True:
            try:
                bestCard = None
                if player.hand[0].cowsNb <=1 :
                    for ligne in game.table:
                        if game.total_cows(ligne) <=1:
                            bestCard = player.hand[0].value
                if bestCard is None:
                    all_full = all(len(ligne) == 5 for ligne in game.table)
                    if not all_full:
                        sortTable = sorted(game.table, key=lambda x: x[-1])
                        minValue = game.table[0][-1].value
                        eligible_cards = [card for card in player.hand if card.value > minValue]
                        wherePlaced = {}

                        sorted_indices_and_lengths = sorted(enumerate(map(len, sortTable)), key=lambda x: x[1]) #permet de recup dans l'ordre les lignes avec le moins de len 
                        ordreBestLigne = [index for index, _ in sorted_indices_and_lengths]

                        for i in range(4):
                            for card in eligible_cards :
                                if i == 3:
                                    if(card.value > sortTable[i][-1].value and card.value < 105):
                                        wherePlaced[card.value] = i
                                else:
                                    if(card.value > sortTable[i][-1].value and card.value < sortTable[i+1][-1].value):
                                        wherePlaced[card.value] = i
                        for line_index in ordreBestLigne:
                            if line_index in wherePlaced.values():
                                cards_for_line = [card for card, index in wherePlaced.items() if index == line_index]
                                bestCard = min(cards_for_line)
                                break
                    else:
                        bestCard=max(player.hand).value
                #print("Le chiffre sélectionné (plus grande carte) dans la liste est :", bestCard)
                if bestCard is None :
                    bestCard = random.choice(player.hand).value
                if bestCard <= 0:
                    raise ValueError
                return bestCard
            except ValueError:
                self.info("Veuillez entrer un nombre entier positif.")

    def getLine(self, game):
        """
        permet d'obtenir la ligne à enlever quand la carte jouée était plus petite

        :param game: le jeu en cours
        :return: la ligne à enlever
        """
        while True:
            try:
                nbTeteBoeuf = []
                for row in game.table:
                    nbTeteBoeuf.append(game.total_cows(row))
                line = nbTeteBoeuf.index(min(nbTeteBoeuf))+1
                #print("La ligne avec le moins de têtes de bœuf est :", line)
                if 1 <= line <= 4:
                    return line
                else:
                    self.info("Vous devez choisir une ligne entre 1 et 4")
            except ValueError:
                self.info("Veuillez entrer un nombre entier entre 1 et 4.")

    def __repr__(self):
        return "Metissage"

class BestChoice(Strategy):
    def getCard(self,player,game):    
        """
        Permet d'obtenir la carte à jouer.

        :return: La réponse du joueur.
        """    
        while True:
            try:
                bestCard = None
                if bestCard is None:
                    all_full = all(len(ligne) == 5 for ligne in game.table)
                    if not all_full:
                        sortTable = sorted(game.table, key=lambda x: x[-1])
                        minValue = game.table[0][-1].value
                        eligible_cards = [card for card in player.hand if card.value > minValue]
                        wherePlaced = {}

                        sorted_indices_and_lengths = sorted(enumerate(map(len, sortTable)), key=lambda x: x[1]) #permet de recup dans l'ordre les lignes avec le moins de len 
                        ordreBestLigne = [index for index, _ in sorted_indices_and_lengths]

                        for i in range(4):
                            for card in eligible_cards :
                                if i == 3:
                                    if(card.value > sortTable[i][-1].value and card.value < 105):
                                        wherePlaced[card.value] = i
                                else:
                                    if(card.value > sortTable[i][-1].value and card.value < sortTable[i+1][-1].value):
                                        wherePlaced[card.value] = i
                        for line_index in ordreBestLigne:
                            if line_index in wherePlaced.values():
                                cards_for_line = [card for card, index in wherePlaced.items() if index == line_index]
                                bestCard = min(cards_for_line)
                                break
                    else:
                        bestCard=max(player.hand).value
                #print("Le chiffre sélectionné (plus grande carte) dans la liste est :", bestCard)
                if bestCard is None :
                    bestCard = random.choice(player.hand).value
                if bestCard <= 0:
                    raise ValueError
                return bestCard
            except ValueError:
                self.info("Veuillez entrer un nombre entier positif.")

    def getLine(self, game):
        """
        permet d'obtenir la ligne à enlever quand la carte jouée était plus petite

        :param game: le jeu en cours
        :return: la ligne à enlever
        """
        while True:
            try:
                nbTeteBoeuf = []
                for row in game.table:
                    nbTeteBoeuf.append(game.total_cows(row))
                line = nbTeteBoeuf.index(min(nbTeteBoeuf))+1
                #print("La ligne avec le moins de têtes de bœuf est :", line)
                if 1 <= line <= 4:
                    return line
                else:
                    self.info("Vous devez choisir une ligne entre 1 et 4")
            except ValueError:
                self.info("Veuillez entrer un nombre entier entre 1 et 4.")

    def __repr__(self):
        return "BestChoice"



class MinMaxLike(Strategy):
	def evaluate(self, game, player):
		return player.score

	def minmax(self, game, player, depth, k):
		if len(player.hand) == 0 or depth == 0:
			return None, self.evaluate(game, player)
			
		cartesImpossible = game.alreadyPlayedCards + [card for card in player.hand]
		cartesPossible = [Card(i) for i in range(1, 105) if Card(i) not in cartesImpossible]
		
		_min = float('inf')
		best = None
		
		for card in player.hand:
			avg = 0
			
			for _ in range(k):
				game2 = copy.deepcopy(game)
				player2 = copy.deepcopy(player)
				
				E = random.sample(cartesPossible, len(game2.players)-1)
				action = []
				for p in game2.players:
					if p.name != player2.name:
						c = random.choice(E)
						action.append([p, c])
						E.remove(c)
				action.append([player2, card])
				game2.update_table(action)
			
				_, score = self.minmax(game2, player2, depth - 1, k)
				avg += score
			
			avg /= k
			
			if avg < _min:
				_min = avg
				best = card
		
		return best, _min
	
	def getCard(self, player, game):
		depth = 3
		k = 1
		
		card, _ = self.minmax(game, player, depth, k)
		
		return card.value
			
		
	def getLine(self, game):
		"""
		permet d'obtenir la ligne à enlever quand la carte jouée était plus petite

		:param game: le jeu en cours
		:return: la ligne à enlever
		"""
		while True:
			try:
				nbTeteBoeuf = []
				for row in game.table:
					nbTeteBoeuf.append(game.total_cows(row))
				line = nbTeteBoeuf.index(min(nbTeteBoeuf))+1
				#print("La ligne avec le moins de têtes de bœuf est :", line)
				if 1 <= line <= 4:
					return line
				else:
					self.info("Vous devez choisir une ligne entre 1 et 4")
			except ValueError:
				self.info("Veuillez entrer un nombre entier entre 1 et 4.")

	def __repr__(self):
		return "MinMaxLike"