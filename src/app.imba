# TODO: Hold score not showing
# TODO: Lost lot, doesn't switch players.
let activePlayer = 0
let targetScore = 200
let totalScore = [0,0]
let turnScore = 0
let dice = 0
let playing = true
let download = "https://github.com/iamtirado/imba-pig-game"
var counter = 0
tag game-info
	def render
		<self>
			<p.rules>
				<b> "How to Play:"
				<ol>
					<li> "First player to reach "
						<b> targetScore 
						" wins"
					<li> "If Dice Rolls 1, "
						<b> "you lose your lot"
						", and your turn ends"
					<li> "Press "
						<b> '\"HOLD\" '
						"to add your lot to your score and end your turn."
			<p.credits>
				"Coded by "
				<a href="https://github.com/iamtirado/imba-2-pig-game" target="_blank"> "Eric"
				" with the "
				<a href="http://github.com/imba/imba" target="_blank"> "Imba"
				" Language. Example borrowed from the "
				<a href="https://codingheroes.io" target="_blank"> "codingheroes.io"
				" Master Javascript Course"

tag player-panel
	@player
	# if player panel is same as active player show turn's score, or else show 0
	def currentScore
		if @player is activePlayer then turnScore else 0
	# if thers is a winner, show winner or else show player name.
	def playerName
		if playing is no and @player is activePlayer
			"Winner!"
		else
			"Player {@player + 1}"
	# if player has won, evaluate to true
	def playerWins # i2 - put inline
		if @player is activePlayer and playing is no
			yes
	def isActive # i2 - put inline
		@player is activePlayer and playing

	def isWinner # i2 - put inline
		playing is false and @player is activePlayer
	def render
		<self .active=(@player is activePlayer and playing) .winner=(playing is false and @player is activePlayer)>
			<div.player-name>
				self.playerName()
			<div.player-score>
				totalScore[@player]
			<div.player-current-box>
				<div.player-current-label> "lot"
				<div.player-current-score>
					self.currentScore()

tag pig-game
	# reset all values and switch players
	def nextPlayer
		if playing
			if activePlayer === 0 then activePlayer = 1 else activePlayer = 0
			turnScore = 0
	def newGame 
		totalScore = [0,0]
		turnScore = 0
		playing = true
		self.nextPlayer()
	def hasWon player
		if totalScore[player] >= targetScore
			playing = false
	def holdScore
		totalScore[activePlayer] += turnScore
		turnScore = 0
		# if playeer has won
		if totalScore[activePlayer] >= targetScore
			playing = false
		self.nextPlayer()
	def loseScore
		turnScore = 0
		self.hasWon(activePlayer)
		self.nextPlayer()
	def rollDice
		if playing
			# TODO: Change 3 to 6 for production
			dice = Math.floor(Math.random() * 6) + 1
			if dice isnt 1
				turnScore += dice
			else
				self.loseScore()
	def render
		<self>
			<div.wrapper.clearfix>
				# Panel Player One
				<player-panel player=0>
				# Panel Player Two
				<player-panel player=1>
				<div.button-wrapper>
					# New Game
					<button.btn-new :click.newGame>
						<i.fi-plus> 
						"New game"
					# Roll Dice
					<button.btn-roll :click.rollDice> 
						<i.fi-loop>
						"Roll Dice"
					# Hold Score
					<button.btn-roll :click.holdScore>
						<i.fi-arrow-down>
						"Hold"
				# Dice Image
				if dice isnt 0
					<img.dice src="./images/dice-{dice}.png" alt="dice-{dice}">
				else
					<img.dice src="./images/dice-1.png" alt="dice-1">
				<game-info>

				

### css
:root {
	--third: rgba(105, 36, 166, 1.00);
	--first: rgba(255, 89, 69, 1.00);
	--second: rgba(255, 220, 0, 1.00);
	--white: #fff;
	--gray: #f0f0f0;
	--mediumgray: #606060;
	--dark: #444444;
	--shadow: rgba(10,10,0,.1);
}

* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

.clearfix::after {
	content: "";
	display: table;
	clear: both;
}
body {
	background-color: var(--third);
}
pig-game {
	width: 100%;
	background: var(--first);
	background-size: cover;
	background-position: center;
	font-family: Lato;
	font-weight: 300;
	min-height: 100vh;
	color: var(--dark);
}

.wrapper {
	width: 1000px;
	position: absolute;
	top: 35%;
	left: 50%;
	transform: translate(-50%, -50%);
	background-color: var(--white);
	box-shadow: 0px 10px 50px var(--shadow);
}

player-panel {
	width: 50%;
	float: left;
	height: 600px;
	padding: 100px;
	background-color: var(--white);
}

.player-name {
	font-size: 40px;
	text-align: center;
	text-transform: uppercase;
	letter-spacing: 2px;
	font-weight: 100;
	margin-top: 20px;
	margin-bottom: 10px;
	position: relative;
}

.player-score {
	text-align: center;
	font-size: 80px;
	font-weight: 100;
	color: var(--first);
	margin-bottom: 130px;
}

.active {
	background-color: var(--gray);
}

.active .player-name {
	font-weight: 300;
}

.active .player-name::after {
	content: "X";
	font-size: 47px;
	position: absolute;
	color: var(--first);
	top: -7px;
	right: 10px;
}

.player-current-box {
	background-color: var(--first);
	color: var(--white);
	width: 40%;
	margin: 0 auto;
	padding: 12px;
	text-align: center;
}

.player-current-label {
	text-transform: uppercase;
	margin-bottom: 10px;
	font-size: 12px;
	color: var(--gray);
}

.player-current-score {
	font-size: 30px;
}

.hidden {
	display: none;
}
.button-wrapper {
	display: flex;
	height: 200px;
	position: absolute;
	left: 50%;
	transform: translateX(-50%);
	width: 200px;
	flex-direction: column;
	bottom: 0;
}
button {
	width: 200px;
	color: var(--dark);
	background: none;
	border: none;
	font-family: Lato;
	font-size: 20px;
	text-transform: uppercase;
	cursor: pointer;
	font-weight: 300;
	transition: background-color 0.3s, color 0.3s;
}

button:hover {
	font-weight: 600;
}

button:hover i {
	margin-right: 20px;
}

button:focus {
	outline: none;
}

i {
	color: var(--first);
	display: inline-block;
	margin-right: 15px;
	font-size: 32px;
	line-height: 1;
	vertical-align: text-top;
	margin-top: -4px;
	transition: margin 0.3s;
}

.btn-new {
	top: 45px;
}

.btn-roll {
	top: 403px;
}

.btn-hold {
	top: 467px;
}

.dice {
	position: absolute;
	left: 50%;
	top: 160px;
	transform: translateX(-50%);
	height: 130px;
	box-shadow: 0px 10px 60px var(--shadow);
	display: block;
}

.winner {
	background-color: var(--gray);
}

.winner .player-name {
	font-weight: 300;
	color: var(--first);
}

game-info {
	position: absolute;
	top: 600px;
	width: 100%;
	color: var(--gray);
	text-align: center;
	display: block;
}
game-info a {
	color: var(--second);
}

.rules {
	background-color: var(--mediumgray);
	color: var(--white);
	text-align: left;
	padding: 1em 2em;
	margin-bottom: 1em;
}
###			
