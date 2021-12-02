const socket = io('http://localhost:3000', { autoConnect: true });
const canvas = document.getElementById('canvasrps');
const ctx = canvas.getContext('2d');
const rpsOptions = { ROCK: 'r', PAPER: 'p', SCISSORS: 's' };

canvas.width = innerWidth;
canvas.height = innerHeight;

class Tinder4Logic {
    constructor(selector){
        this.ROWS = 6;
        this.COLS = 7;
        this.player = 'teal';
        this.selector = selector;
        this.isGameOver = false;
        this.onPlayerMove = function () {};
        this.createGrid();
        this.setEventListener();
    }
//$-refers to jquery convention
    createGrid(){
        const $gameboard = $(this.selector);  
        $gameboard.empty();
        this.isGameOver = false;    
        this.player = 'teal';
        for (let row=0; row<this.ROWS; row++){
            const $row = $('<div>')
            .addClass('row');
            for (let col=0; col<this.COLS; col++){
                const $col = $('<div>')
                .addClass('col empty')
                .attr('data-col', col)
                .attr('data-row', row);
                $row.append($col);
            }
            $gameboard.append($row);
        }
    }  

    setEventListener(){
        const $gameboard = $(this.selector);
        const memory = this;

        function findLastEmptyCell(col){
            const cells = $(`.col[data-col='${col}']`);
            for (let i = cells.length - 1; i >= 0; i--){
                const $cell = $(cells[i]);
                if ($cell.hasClass('empty')){
                    return $cell;
                }
            }
            return null;
        }

        
        $gameboard.on('mouseenter', '.col.empty', function(){
            if (memory.isGameOver) return;
            const col = $(this).data('col');
            const $lastEmptyCell = findLastEmptyCell(col);
            $lastEmptyCell.addClass(`next-${memory.player}`);
        });

        $gameboard.on('mouseleave', '.col', function() {
            $('.col').removeClass(`next-${memory.player}`);
        });

        $gameboard.on('click', '.col.empty', function(){
            if (memory.isGameOver) return;
            const col = $(this).data('col');
            const row = $(this).data('row');
            const $lastEmptyCell = findLastEmptyCell(col);

            $lastEmptyCell.removeClass(`empty next-${memory.player}`);
            $lastEmptyCell.addClass(memory.player);
            $lastEmptyCell.data('player', memory.player);
            
            const win = memory.checkForWinner($lastEmptyCell.data('row'), $lastEmptyCell.data('col'));
            if (win){
                memory.isGameOver = true;
                //alert should use players username
                alert(`Game has finished, ${memory.player} has won!`);
                $('.col.empty').removeClass('empty');
                return;
            }
            memory.player = (memory.player === 'teal') ? 'red' : 'teal';
            //make into username
            memory.onPlayerMove();
            $(this).trigger("mouseenter");
        })

    }

    checkForWinner(row, col){ 
        const mem = this;

        function $getCell(i, j){
            return $(`.col[data-row='${i}'][data-col='${j}']`);
        }

        function checkDir(dir){
            let total = 0;
            let i = row + dir.i;
            let j = col + dir.j;
            let $next = $getCell(i,j);
            while(i >= 0 &&
                i < mem.ROWS &&
                j >= 0 &&
                j < mem.COLS &&
                $next.data('player') === mem.player)
                {
                total++;
                i += dir.i;
                j += dir.j;
                $next = $getCell(i, j);
            }
                return total;
        }

        function checkWin(dirA, dirB){
            const total = 1 + 
            checkDir(dirA) +
            checkDir(dirB);
            if (total >= 4) {
                return mem.player;
            }
            else {
                return null;
            }
        }

        function checkVerticals(){ 
            return checkWin({i: -1, j: 0}, {i: 1, j: 0});
        }
        function checkHorizontals(){ 
            return checkWin({i: 0, j: -1}, {i: 0, j: 1});
        }
        function checkDiagonalBLtoTR(){
            return checkWin({i: 1, j: -1}, {i: 1, j: 1});
        }
        function checkDiagonalTLtoBR(){
            return checkWin({i: 1, j: 1}, {i: -1, j: -1});
            //return checkWin({i: 1, j: -1}, {i: -1, j: 1});
        }


        return checkVerticals() || checkHorizontals() ||
            checkDiagonalBLtoTR() || checkDiagonalTLtoBR();
        
    
    }
    //lock restart to when one person wins, othersie just send them back to the play section
    restart(){
        this.createGrid();
        this.onPlayerMove();
    }
}













//options
const rockBtn = document.getElementById('rock');
const paperBtn = document.getElementById('paper');
const scissorBtn = document.getElementById('scissors');

//ready
//const readyBtn = document.getElementById('ready');

//images
var rockImg = new Image();
rockImg.src = '../images/rock1.png';
var paperImg = new Image();
paperImg.src = '../images/paper1.png';
var scissorImg = new Image();
scissorImg.src = '../images/scissor1.png';

//opponent
const opponentPickElement = document.getElementById('opponentsPick');

//scores
const playersScore = document.getElementById('pScore');
const opponentsScore = document.getElementById('oScore');
playersScore.innerHTML = 0;
opponentsScore.innerHTML = 0;

//displayes the round winner depending on who won
const roundRes1 = document.getElementById('roundResult1');
const roundRes2 = document.getElementById('roundResult2');

const nextRoundEl = document.getElementById('nextRoundElement');

//names
const pNameEl = document.getElementById('pNameEl');
const oNameEl = document.getElementById('oNameEl');

//player class
class RPSPlayer {
	constructor(name, x, y, width, height) {
		this.username = name;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.currentSelected = rpsOptions.ROCK;
		this.ready = false;
	}

	update() {
		this.draw();
		//this resets the x,y,width, and height properties of the player every update
		//it makes sure that if the screen is resized it keeps the same ratio and not the original values
		this.x = canvas.width / 8;
		this.y = canvas.height / 4;
		this.width = canvas.width / 14;
		this.height = canvas.width / 14;
	}

	draw() {
		ctx.beginPath();

		if (this.currentSelected == rpsOptions.ROCK) {
			ctx.drawImage(
				rockImg,
				this.x,
				this.y,
				this.width * 2,
				this.height * 2
			);
		} else if (this.currentSelected == rpsOptions.PAPER) {
			ctx.drawImage(
				paperImg,
				this.x,
				this.y,
				this.width * 2,
				this.height * 2
			);
		} else {
			//or rpsOptions.SCISSORS
			ctx.drawImage(
				scissorImg,
				this.x,
				this.y,
				this.width * 2,
				this.height * 2
			);
		}

		ctx.fill();
	}

	changeSelection(newSelection) {
		this.currentSelected = newSelection;
	}
}

class Opponent {
	constructor(name, x, y, width, height) {
		this.username = name;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.currentSelected = rpsOptions.ROCK;
		this.ready = false;
	}

	update() {
		//should search for a change of the choice in the databaase and if they player clicked ready
		//this resets the x,y,width, and height properties of the opponent every update
		//it makes sure that if the screen is resized it keeps the same ratio and not the original values
		this.x = canvas.width - canvas.width / 4;
		this.y = canvas.height / 4;
		this.width = canvas.width / 14;
		this.height = canvas.width / 14;
	}

	draw() {
		if (this.ready) {
			ctx.beginPath();

			if (this.currentSelected == rpsOptions.ROCK) {
				ctx.drawImage(
					rockImg,
					this.x,
					this.y,
					this.width * 2,
					this.height * 2
				);
			} else if (this.currentSelected == rpsOptions.PAPER) {
				ctx.drawImage(
					paperImg,
					this.x,
					this.y,
					this.width * 2,
					this.height * 2
				);
			} else {
				ctx.drawImage(
					scissorImg,
					this.x,
					this.y,
					this.width * 2,
					this.height * 2
				);
			}

			ctx.fill();
		}
	}

	changeSelection(newSelection) {
		this.currentSelected = newSelection;
	}
}

let pScore = 0;
let oScore = 0;
let roundOver = false;
let nextRoundCountDown = 5;

let animationId;
let countDownTimerId;

//the names are set later once players join*
let player = new RPSPlayer(
	'',
	canvas.width / 8,
	canvas.height / 4,
	canvas.width / 14,
	canvas.width / 14
);
let opponent = new Opponent(
	'',
	canvas.width - canvas.width / 4,
	canvas.height / 4,
	canvas.width / 14,
	canvas.width / 14
);

let currentLobby;
let isOpponent = false;
let round = 1;

function animate() {
	canvas.width = innerWidth;
	canvas.height = innerHeight;

	animationId = requestAnimationFrame(animate);
	ctx.fillStyle = 'rgb(26, 24, 24)'; //sets the color to the background color
	ctx.fillRect(0, 0, canvas.width, canvas.height); //fills the background after every draw

	player.update();
	opponent.update();
	if (roundOver) {
		//if the round is over, first verify if the game is over before starting a new round
		if (pScore == 3) {
			nextRoundEl.innerHTML =
				'You won!! Redirecting to play page in ' +
				nextRoundCountDown +
				'...';
			if (nextRoundCountDown <= 0) {
				//move to the play page
				window.location = '/play';
			}
		} else if (oScore == 3) {
			nextRoundEl.innerHTML =
				'You Lost!! Redirecting to play page in ' +
				nextRoundCountDown +
				'...';
			if (nextRoundCountDown <= 0) {
				//move to the play page
				window.location = '/play';
			}
		} else {
			nextRoundEl.innerHTML =
				'Next round in ' + nextRoundCountDown + '...';
			if (nextRoundCountDown <= 0) {
				resetRound();
			}
		}
		opponent.draw();
	}

	if (opponent.username == '') {
		opponentPickElement.innerHTML = 'Waiting on opponent to join...';
	} else if (!opponent.ready) {
		opponentPickElement.innerHTML = 'Picking...';
	} else if (!player.ready && opponent.ready) {
		opponentPickElement.innerHTML = 'Picked!';
	} else if (player.ready && opponent.ready && !roundOver) {
		opponentPickElement.innerHTML = null;
		pickRoundkWinnerAndUdpateScore();
		roundOverCountDown(); //calls the countdown only once since it has an interval in the inside!
		roundOver = true;
	}
}

function pickRoundkWinnerAndUdpateScore() {
	if (player.currentSelected == opponent.currentSelected) {
		//tie
		roundRes1.innerHTML = 'tie!';
		roundRes2.innerHTML = 'tie!';
	} else if (
		(player.currentSelected == rpsOptions.PAPER &&
			opponent.currentSelected == rpsOptions.ROCK) ||
		(player.currentSelected == rpsOptions.ROCK &&
			opponent.currentSelected == rpsOptions.SCISSORS) ||
		(player.currentSelected == rpsOptions.SCISSORS &&
			opponent.currentSelected == rpsOptions.PAPER)
	) {
		//player wins
		playersScore.innerHTML = ++pScore;
		roundRes1.innerHTML = 'Round Winner!';
		roundRes2.innerHTML = null;
	} else {
		//if player didn't win, and it wasn't a tie, then opponent won
		opponentsScore.innerHTML = ++oScore;
		roundRes1.innerHTML = null;
		roundRes2.innerHTML = 'Round Winner!';
	}
}

function roundOverCountDown() {
	countDownTimerId = setInterval(() => {
		nextRoundCountDown--;
	}, 1000); //every second it ticks down the counter (1000 ms)
}

async function resetRound() {
	player.changeSelection(rpsOptions.ROCK);
	player.ready = false;

	opponent.changeSelection(rpsOptions.ROCK);
	opponent.ready = false;

	//refer to the side note in inside the event listener for the ready btn
	//readyBtn.style.display = 'initial';
	rockBtn.style.display = 'initial';
	paperBtn.style.display = 'initial';
	scissorBtn.style.display = 'initial';

	roundRes1.innerHTML = null;
	roundRes2.innerHTML = null;

	nextRoundEl.innerHTML = null;

	clearInterval(countDownTimerId); //cancel the counter such that it doesn't keep running
	nextRoundCountDown = 5; //this line and the one above are not interchangeable**
	round++;
	startGame(currentLobby);
	roundOver = false;
}

//listeners for the buttons
rockBtn.addEventListener('click', () => {
	player.changeSelection(rpsOptions.ROCK);
});

paperBtn.addEventListener('click', () => {
	player.changeSelection(rpsOptions.PAPER);
});

scissorBtn.addEventListener('click', () => {
	player.changeSelection(rpsOptions.SCISSORS);
});

readyBtn.addEventListener('click', () => {
	socket.emit(
		'addAction',
		`Round #${round}: ${player.username} shot:${player.currentSelected}`
	);
	player.ready = true;

	//removes all the buttons such that they can't be used if the player is ready
	//side note, there are several aways to accomplish this, though i picked this one as it works in the case of the game and the purpose of "removing them"
	//readyBtn.style.display = 'none';
	rockBtn.style.display = 'none';
	paperBtn.style.display = 'none';
	scissorBtn.style.display = 'none';
});

async function startGame() {
	let player1, player2;
	if (!isOpponent){
		player1 = currentLobby.players[0];
		player2 = currentLobby.players[1];
	}
	else{
		player1 = currentLobby.players[1];
		player2 = currentLobby.players[0];
	}
	
	player.username = player1.username;
	opponent.username = player2.username;
	pNameEl.innerHTML = player1.username;
	oNameEl.innerHTML = player2.username;
	let action = `Round #${round}: ${opponent.username} shot:`;
	console.log(action);

	// Wait for the opponent to shoot
	await socket.emit('waitForAction', currentLobby._id, action);
}

// When the user connects, join an available lobby!
// Emits either 'noLobbyFound', or 'lobbyFound'
socket.on('connect', async () => {
	console.log('Someone connected!');
	socket.emit('findAvailableLobby', 'C4');
});

// Create a lobby if none is found.
// Emits 'createLobbySuccess' on creation
socket.on('noLobbyFound', async () => {
	console.log('No lobby found. Creating new lobby');
	socket.emit('createLobby', Date.now(), 'C4', 2);
});

// A vacant lobby was found. Join it!
// Emits 'joinedSuccessfully' or 'failedToJoin'
socket.on('lobbyFound', async (lobby) => {
	currentLobby = lobby;
	console.log('Found lobby: ' + currentLobby);
	socket.emit('joinLobby', currentLobby._id, player);
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
	// Start the game!
	// Player entered first!
	startGame(currentLobby);
});

socket.on('joinedSuccessfully', async (lobby) => {
	currentLobby = lobby;
	const player1 = currentLobby.players[0];
	const player2 = currentLobby.players[1];
	if (!player2) {
		//then "this" joined as the player1
		player.username = player1.username;
		pNameEl.innerHTML = player1.username;
		//start a loop in app.js that looks for when player2 joins
		socket.emit('waitUntilFull', currentLobby._id);
	} else {
		//then "this" joined as the player2
		// Start the game!
		// Player entered second!
		isOpponent = true;
		startGame(currentLobby);
	}
	currentLobby = lobby;
	socket.emit('addAction', player.username + ' joined the lobby.');
	animate();
});

socket.on('actionFound', async (action) => {
	opponent.changeSelection(action.substring(action.lastIndexOf(':') + 1));
	opponent.ready = true;
});
