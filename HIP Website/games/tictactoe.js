const canvas = document.getElementById('canvastictactoe');
const socket = io('http://localhost:3000', { autoConnect: true });

let player = { username: '', symbol: 'O' };
let player2 = { username: '', symbol: 'x' };

//stores player turns
let currentPlayer;

let gameStatus;

let isPlayer2;
let currentLobby;

let actionTrigger = 'chose';
let resetTrigger = 'reset';

//counts the times a player has played a turn
let totalTurns = 0;

//Gets all Boxes elements
const boxes = document.getElementsByClassName('box');

function checkAndDisplayWinner(a, b, c) {
	if (
		boxes[a].innerHTML == boxes[b].innerHTML &&
		boxes[b].innerHTML == boxes[c].innerHTML &&
		boxes[a].innerHTML.trim() != ''
	) {
		showWinner(a, b, c);
	}
}

//loops through all the elements
for (let i = 0; i < boxes.length; i++) {
	//adds event listener to each box;
	boxes[i].addEventListener('click', function () {
		//checks if the box has an x or an o in it and also checks if the game is still on
		if (
			boxes[i].innerHTML.trim() == '' &&
			gameStatus == 'Game On' &&
			currentPlayer == player
		) {
			socket.emit(
				'addAction',
				`${currentPlayer.username} ${actionTrigger} box#${i}`
			);
		}
	});
}

//resets the game
document.getElementById('reset').addEventListener('click', function () {
	resetGame();
});

function resetGame() {
	if (gameStatus === 'Game On') return;
	for (let i = 0; i < boxes.length; i++) {
		boxes[i].innerHTML = '';
		boxes[i].style.backgroundColor = '#dee9ec';
		boxes[i].style.color = 'black';
	}
	currentPlayer = isPlayer2 ? player2 : player;
	gameStatus = 'Game On';
	document.getElementById('message').style.display = 'none';
	document.getElementById('drawResult').style.display = 'none';
	socket.emit('waitForAction', currentLobby._id, actionTrigger);

	if (!isPlayer2) {
		document.getElementById(
			'turn'
		).innerHTML = `${currentPlayer.username}, it is your turn`;
	} else {
		document.getElementById(
			'turn'
		).innerHTML = `Waiting for ${currentPlayer.username} to play`;
	}
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
	document.getElementById('winner').innerHTML = currentPlayer.symbol;
	document.getElementById('message').style.display = 'block';
	gameStatus = 'Game Over';
}

function drawGame() {
	document.getElementById('drawResult').style.display = 'block';
	gameStatus = 'Game Over';
	totalTurns = 0;
}

function startGame() {
	if (!isPlayer2) {
		player = currentLobby.players[0];
		player2 = currentLobby.players[1];
	} else {
		player = currentLobby.players[1];
		player2 = currentLobby.players[0];
	}

	console.log(player);
	console.log(player2);

	resetGame();
}

// When the user connects, join an available lobby!
// Emits either 'noLobbyFound', or 'lobbyFound'
socket.on('connect', async () => {
	console.log('Someone connected!');
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

// A lobby was creatted successfully, join it!
// Emits 'joinedSuccessfully' or 'failedToJoin'
socket.on('createLobbySuccess', async (lobby) => {
	currentLobby = lobby;
	console.log('Lobby created successfully!');
	socket.emit('joinLobby', currentLobby._id, player);
});

socket.on('failedToJoin', async (lobby) => {});

socket.on('lobbyFilled', async (lobby) => {
	currentLobby = lobby;
	// Only player 1 will reach here
	startGame();
});

socket.on('joinedSuccessfully', async (lobby) => {
	currentLobby = lobby;
	const tmpplayer1 = currentLobby.players[0];
	const tmpplayer2 = currentLobby.players[1];
	if (!tmpplayer2) {
		// They are player1;
		player = tmpplayer1;
		document.getElementById(
			'turn'
		).innerHTML = `Waiting for player2 to join...`;
		await socket.emit('waitUntilFull', currentLobby._id);
	} else {
		isPlayer2 = true
		startGame();
	}

	socket.emit('addAction', player.username + ' joined the lobby.');
});

socket.on('actionFound', async (action) => {
	if (action.includes(resetTrigger)) {
		resetGame();
	} else {
		await socket.emit('removeAction', currentLobby._id, action);
		//adds x or o for the current play in their chosen box
		boxes[parseInt(action.substring(action.lastIndexOf('#') + 1))].innerHTML = currentPlayer.symbol;

		//changes player turns
		currentPlayer = currentPlayer == player ? player2 : player;
		setTimeout(function () {
			// Wait 1 second
		}, 1000);

		//changes total turns count
		totalTurns++;

		//changes player's turn label on top of the game
		if (currentPlayer == player) {
			document.getElementById(
				'turn'
			).innerHTML = `${currentPlayer.username}, it is your turn`;
		} else {
			document.getElementById(
				'turn'
			).innerHTML = `Waiting for ${currentPlayer.username} to play`;
		}

		//checks 3 matching x's or o's
		checkAndDisplayWinner(1, 2, 3);
		checkAndDisplayWinner(3, 4, 5);
		checkAndDisplayWinner(6, 7, 8);
		checkAndDisplayWinner(0, 3, 6);
		checkAndDisplayWinner(1, 4, 7);
		checkAndDisplayWinner(2, 5, 8);
		checkAndDisplayWinner(0, 4, 8);
		checkAndDisplayWinner(2, 4, 6);

		//verify if it's a draw
		if (totalTurns == 9) {
			drawGame();
		}

		await socket.emit('waitForAction', currentLobby._id, actionTrigger);
	}
});
