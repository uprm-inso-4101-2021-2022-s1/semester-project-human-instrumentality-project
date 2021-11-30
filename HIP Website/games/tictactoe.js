const socket = io('http://localhost:3000', { autoConnect: true });
const canvas = getElement('canvastictactoe');

// Both players
let player1 = { username: '', symbol: 'x' };
let player2 = { username: '', symbol: 'o' };

//stores player turns
let currentPlayer = player1;

// Determines whether the user is player 1 or player 2
let isPlayer2;

// The current lobby of both players
let currentLobby;

//stores the status of the game, whether its over or still in play
let gameStatus;

//counts the times a player has played a turn
let totalTurns;

//Gets all Boxes elements
const boxes = document.getElementsByClassName('box');

const actionTrigger = 'played';

//resets the game
function resetGame() {
	for (let i = 0; i < boxes.length; i++) {
		boxes[i].innerHTML = '';
		boxes[i].style.backgroundColor = '#dee9ec';
		boxes[i].style.color = 'black';
	}
	getElement('message').style.display = 'none';
	getElement('drawResult').style.display = 'none';
	gameStatus = 'Game On';
	currentTurns = 0;
	currentPlayer = player1;

	getElement('turn').innerHTML = isPlayer2
		? `Waiting for ${currentPlayer.username}'s turn`
		: `${currentPlayer.username}. It is your turn`;

	// Turn on the boxes for player 1 only
	enableBoxClickListeners(!isPlayer2);

	socket.emit('waitForAction', actionTrigger);
}

function getElement(id) {
	return document.getElementById(id);
}

//displays the winner
function showWinner(x, y, z) {
	totalTurns = 0;
	boxes[x].style.background = '#0d8b70';
	boxes[x].style.color = 'white';
	boxes[y].style.background = '#0d8b70';
	boxes[y].style.color = 'white';
	boxes[z].style.background = '#0d8b70';
	boxes[z].style.color = 'white';
	getElement('winner').innerHTML = currentPlayer == 'x' ? 'O' : 'X';
	getElement('message').style.display = 'block';
	gameStatus = 'Game Over';

	// All boxes should be turned off
	enableBoxClickListeners(false);
	enableReset(true);
}

function drawGame() {
	getElement('drawResult').style.display = 'block';
	gameStatus = 'Game Over';
	totalTurns = 0;
}

function boxClickListener(box) {
	//checks if the box has an x or an o in it and also checks if the game is still on
	if (box.innerHTML.trim() == '' && gameStatus == 'Game On') {
		//adds x or o for the current play in their chosen box
		box.innerHTML = currentPlayer.symbol;

		//changes total turns count
		totalTurns++;

		socket.emit('action', `${currentPlayer.username}: ${actionTrigger}`);

		//checks 3 matching x's or o's
		if (
			boxes[0].innerHTML == boxes[1].innerHTML &&
			boxes[1].innerHTML == boxes[2].innerHTML &&
			boxes[0].innerHTML.trim() != ''
		) {
			showWinner(0, 1, 2);
		} else if (
			boxes[3].innerHTML == boxes[4].innerHTML &&
			boxes[4].innerHTML == boxes[5].innerHTML &&
			boxes[3].innerHTML.trim() != ''
		) {
			showWinner(3, 4, 5);
		} else if (
			boxes[6].innerHTML == boxes[7].innerHTML &&
			boxes[7].innerHTML == boxes[8].innerHTML &&
			boxes[6].innerHTML.trim() != ''
		) {
			showWinner(6, 7, 8);
		} else if (
			boxes[0].innerHTML == boxes[3].innerHTML &&
			boxes[3].innerHTML == boxes[6].innerHTML &&
			boxes[0].innerHTML.trim() != ''
		) {
			showWinner(0, 3, 6);
		} else if (
			boxes[1].innerHTML == boxes[4].innerHTML &&
			boxes[4].innerHTML == boxes[7].innerHTML &&
			boxes[1].innerHTML.trim() != ''
		) {
			showWinner(1, 4, 7);
		} else if (
			boxes[2].innerHTML == boxes[5].innerHTML &&
			boxes[5].innerHTML == boxes[8].innerHTML &&
			boxes[2].innerHTML.trim() != ''
		) {
			showWinner(2, 5, 8);
		} else if (
			boxes[0].innerHTML == boxes[4].innerHTML &&
			boxes[4].innerHTML == boxes[8].innerHTML &&
			boxes[0].innerHTML.trim() != ''
		) {
			showWinner(0, 4, 8);
		} else if (
			boxes[2].innerHTML == boxes[4].innerHTML &&
			boxes[4].innerHTML == boxes[6].innerHTML &&
			boxes[2].innerHTML.trim() != ''
		) {
			showWinner(2, 4, 6);
		}
		//verify if it's a draw
		else if (totalTurns == 9) {
			drawGame();
		}
	}
}

function startGame() {
	resetGame();

	// You have entered the point of no return
	enableReset(false);
}

function enableBoxClickListeners(enable) {
	for (let i = 0; i < boxes.length; i++) {
		let box = boxes[i];
		if (!enable) {
			box.removeEventListener('click', boxClickListener(box));
		} else {
			box.addEventListener('click', boxClickListener(box));
		}
	}
}

function enableReset(enable) {
	let resetButton = getElement('reset');
	if (!enable) {
		resetButton.removeEventListener('click', resetGame());
	} else {
		resetButton.addEventListener('click', resetGame());
	}
}

// When the user connects, join an available lobby!
// Emits either 'noLobbyFound', or 'lobbyFound'
socket.on('connect', async () => {
	console.log('Someone connected!');
	// Turn off boxes to prevent moving first
	enableBoxClickListeners(false);
	socket.emit('findAvailableLobby', 'TTT');
});

// Create a lobby if none is found.
// Emits 'createLobbySuccess' on creation
socket.on('noLobbyFound', async () => {
	console.log('No lobby found. Creating new lobby');
	socket.emit('createLobby', Date.now(), 'TTT', 2);
});

// A vacant lobby was found. Join it!
// Emits 'joinedSuccessfully' or 'failedToJoin'
socket.on('lobbyFound', async (lobby) => {
	currentLobby = lobby;
	console.log('Found lobby: ' + currentLobby);
	socket.emit('joinLobby', currentLobby._id, player2);
});

// A lobby was created successfully, join it!
// Emits 'joinedSuccessfully' or 'failedToJoin'
socket.on('createLobbySuccess', async (lobby) => {
	currentLobby = lobby;
	console.log('Lobby created successfully!');
	socket.emit('joinLobby', currentLobby._id, player1);
});

socket.on('failedToJoin', async (lobby) => {});

socket.on('lobbyFilled', async (lobby) => {
	currentLobby = lobby;
	// Start the game!
	// Player entered first!
	startGame();
});

socket.on('joinedSuccessfully', async (lobby) => {
	let name;
	currentLobby = lobby;

	// Player 1 and Player 2 now have usernames assigned!
	player1 = currentLobby.players[0];
	player2 = currentLobby.players[1];
	if (!player2) {
		//then "this" joined as the player1
		//start a loop in app.js that looks for when player2 joins
		name = player1.username;
		socket.emit('waitUntilFull', currentLobby._id);
		getElement('turn').innerHTML = 'Waiting for Player 2 to join...';
	} else {
		//then "this" joined as the player2
		// Start the game!
		// Player entered second!
		name = player2.username;
		isPlayer2 = true;
		startGame();
	}
	socket.emit('addAction', name + ' joined the lobby.');
	currentLobby = lobby;
});

socket.on('actionFound', async (action) => {
	// If an action is found, we just need to changes player turns
	currentPlayer = currentPlayer == player1 ? player2 : player1;
	if (
		(currentPlayer == player2 && isPlayer2) ||
		(currentPlayer == player1 && !isPlayer2)
	) {
		enableBoxClickListeners(true);
		getElement(
			'turn'
		).innerHTML = `${currentPlayer.username}. It is your turn`;
	} else {
		// It's the other players turn!
		getElement(
			'turn'
		).innerHTML = `Waiting for ${currentPlayer.username}'s play`;
		enableBoxClickListeners(false);
	}

	socket.emit('waitForAction', actionTrigger);
});
