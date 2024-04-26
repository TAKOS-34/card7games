from players.player import Player
from players.strategies import Strategy
from game.card import Card


class BotPlayer(Player):

    def __init__(self, name, strategy):
        super().__init__(name)
        self.strategy = strategy

    def info(self, message):
        """
        Affiche un message à l'attention du joueur.
        
        :param message: Le message à afficher.
        """
        print("@"+self.name+"("+str(self.strategy)+") : ",message)


    def getCardToPlay(self,game):
        return self.strategy.getCard(self,game)
    
    def getLineToRemove(self, game):
        return self.strategy.getLine(game)
    

    def player_turn(self, game):
        """
        Gère le tour de jeu d'un joueur.

        :param game : le jeu en cours
        """
        # self.info(game.display_scores())
        # self.info(game.display_table())
        while True:
            #self.info(f"Votre main : {' '.join(map(str, self.hand))}")
            try:
                carteChoisie = Card(self.getCardToPlay(game))
                if carteChoisie in self.hand:
                    return carteChoisie
                else:
                    self.info("Vous n'avez pas cette carte dans votre main")
            except ValueError:
                self.info("Veuillez entrer un nombre entier correspondant à une carte dans votre main.")