//const { name } = require("ejs");

const socket = io('http://localhost:3000', { autoConnect: true });
const canvas = document.getElementById('canvasbjack');
const ctx = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;

//options
const rockBtn = document.getElementById('rock');
const scissorBtn = document.getElementById('scissors');

//images
var rockImg = new Image();
rockImg.src = "../images/rock2.png";
var scissorImg = new Image();
scissorImg.src = "../images/paper2.png";

//opponent
const opponentPickElement = document.getElementById("opponentsPick");

//scores
const playersScore = document.getElementById('pScore');
const opponentsScore = document.getElementById('oScore');
const playersCard = document.getElementById('pCard');
const opponentsCard = document.getElementById('oCard');
const tablesCard = document.getElementById('tCard');
const playerSum = document.getElementById('pSum');
const opponentSum = document.getElementById('oSum');
playersScore.innerHTML = 0;
opponentsScore.innerHTML = 0;
playersCard.innerHTML = 0;
opponentsCard.innerHTML = 0;
tablesCard.innerHTML = 0;
playerSum.innerHTML = 0;
opponentSum.innerHTML = 0;

//displayes the round winner depending on who won
const roundRes1 = document.getElementById('roundResult1');
const roundRes2 = document.getElementById('roundResult2');
const nextRoundEl = document.getElementById('nextRoundElement');

//names
const pNameEl = document.getElementById('pNameEl');
const oNameEl = document.getElementById('oNameEl');

//Table class
class Table{
    constructor(x,y,width,height){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    update(){
        this.draw();
        //this resets the x,y,width, and height properties of the player every update 
        //it makes sure that if the screen is resized it keeps the same ratio and not the original values
        this.x = canvas.width - canvas.width/1.75;
        this.y = canvas.height/3;
        this.width = canvas.width/14;
        this.height = canvas.width/14;
    }

    draw(){
        ctx.beginPath();
        ctx.drawImage(scissorImg,this.x,this.y,this.width*2,this.height*2);
        ctx.fill();
    }

}
//player class
class Player{
    constructor(name,x,y,width,height){
        this.username = name;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.currentSelected = 'r';
        this.ready = false;
    }

    update(){
        this.draw();
        //this resets the x,y,width, and height properties of the player every update 
        //it makes sure that if the screen is resized it keeps the same ratio and not the original values
        this.x = canvas.width/20;
        this.y = canvas.height/3.75;
        this.width = canvas.width/14;
        this.height = canvas.width/14;
    }

    draw(){
        ctx.beginPath();
        
        if(this.currentSelected=='r'){
            ctx.drawImage(scissorImg,this.x,this.y,this.width*2,this.height*2);
        }        
        else{//or 's'
            ctx.drawImage(scissorImg,this.x,this.y,this.width*2,this.height*2);
        }
        ctx.drawImage(scissorImg,this.x,this.y,this.width*2,this.height*2);
        ctx.fill();
    }

    changeSelection(newSelection){
        this.currentSelected=newSelection;
    }
}


class Opponent{
    constructor(name,x,y,width,height){
        this.username = name;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.currentSelected = 'r';
        this.ready = false;
    }

    update(){
        opponent.draw();
        this.x = canvas.width - canvas.width/5.5;
        this.y = canvas.height/3.75;
        this.width = canvas.width/14;
        this.height = canvas.width/14;
    }
    
    draw(){
        ctx.beginPath();

        if(this.currentSelected=='r'){
            ctx.drawImage(scissorImg,this.x,this.y,this.width*2,this.height*2);
        }        
        else{//or 's'
            ctx.drawImage(scissorImg,this.x,this.y,this.width*2,this.height*2);
        }
        ctx.drawImage(scissorImg,this.x,this.y,this.width*2,this.height*2);
        ctx.fill();
    }
    

    changeSelection(newSelection){
        this.currentSelected=newSelection;
    }

}

let table1 = new Table(canvas.width/8,canvas.height/4,canvas.width/14,canvas.width/14);
let player = new Player('', canvas.width/8,canvas.height/4,canvas.width/14,canvas.width/14);
let opponent = new Opponent('', canvas.width-canvas.width/4, canvas.height/4,canvas.width/14,canvas.width/14);

let pScore = 0;
let oScore = 0;
let pCard = 0;
let oCard = 0;
let tCard = 0;
let pSum = 0;
let oSum = 0;
let roundOver = false;
let nextRoundCountDown = 5;
let cardDrawStartTime = 1; 


let animationId;
let countDownTimerId;
//let playerPicked = false;
let opponentPicked = false;//temp

let currentLobby;
let isOpponent = false;
let round = 1;

function animate(){
    
    //CPU Example
    // if(!opponentPicked && playerPicked && !player.ready){
    //     setTimeout(() => {
    //         if(oSum <= 17){
    //             opponentPicked = true;
    //             roundRes2.innerHTML = "Hit.";
    //             roundRes1.innerHTML = null;
    //             opponentSum.innerHTML = tCard + oCard - 1;
    //             oSum = ++opponentSum.innerHTML;
    //            }
    //            else {
    //             opponent.ready = true;
    //             roundRes2.innerHTML = "Stay.";
    //             roundRes1.innerHTML = null;   
    //            } 
    //         playerPicked = false;
    //     }, 1000);//1s
    // }else if (player.ready && !playerPicked){
    //     setTimeout(() => {
    //         if(oSum <= 17){
    //             tablesCard.innerHTML = tCard + Math.ceil(Math.random()*8);
    //             tCard = ++tablesCard.innerHTML;
    //             opponentSum.innerHTML = tCard + oCard - 1;
    //             oSum = ++opponentSum.innerHTML;
                
    //            }
    //            else {
    //             opponent.ready = true;   
    //            } 
    //     }, 1000);//1s
    // }

    canvas.width = innerWidth;
    canvas.height = innerHeight;   
    
    animationId = requestAnimationFrame(animate);
    ctx.fillStyle = 'rgb(26, 24, 24)';//sets the color to the background color
    ctx.fillRect(0,0,canvas.width,canvas.height);//fills the background after every draw

    table1.update();
    player.update();
    opponent.update();

    if(roundOver){
        if(pScore == 3){
            nextRoundEl.innerHTML = "You won!! Redirecting to play page in " + nextRoundCountDown + "...";
            if(nextRoundCountDown <= 0){
                //move to the other page
                window.location = '/play';
            }
        }
        else if(oScore == 3){
            nextRoundEl.innerHTML = "You Lost!! Redirecting to play page in " + nextRoundCountDown + "...";
            if(nextRoundCountDown <= 0){
                //move to the other page
                window.location = '/play';
            }
        }
        else{
            nextRoundEl.innerHTML = "Next round in " + nextRoundCountDown + "...";
            if(nextRoundCountDown <= 0){
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
        roundOverCountDown();//calls the countdown only once since it has an interval in the inside!
        roundOver=true;
    }
}


function pickRoundkWinnerAndUdpateScore(){
    if((pSum > 21 && oSum > 21) || pSum == oSum){
        //tie
        roundRes1.innerHTML = "tie!";
        roundRes2.innerHTML = "tie!";
    }
    else if(oSum > 21 || pSum > oSum){
        //player wins
        playersScore.innerHTML = ++pScore;
        roundRes1.innerHTML = "Round Winner!";
        roundRes2.innerHTML = null;
    }
    else if(pSum > 21 || oSum > pSum){
        //if player didn't win, and it wasn't a tie, then opponent won
        opponentsScore.innerHTML = ++oScore;
        roundRes1.innerHTML = null;
        roundRes2.innerHTML = "Round Winner!";
    }
}


function roundOverCountDown(){
    countDownTimerId = setInterval(() => {
        nextRoundCountDown--;
    },1000);//every second it ticks down the counter (1000 ms)
}



function resetRound(){
    player.changeSelection('r');
    player.ready = false; 
    opponent.changeSelection('r');
    opponent.ready = false;

    //playerPicked = false;
    opponentPicked = true;

    //refer to the side note in inside the event listener for the ready btn 
    rockBtn.style.display="initial";
    scissorBtn.style.display="initial";
    
    roundRes1.innerHTML = null;
    roundRes2.innerHTML = null;

    nextRoundEl.innerHTML = null;

    pSum = 0;
    oSum = 0;
    
    pCard = 0;
    playersCard.innerHTML = pCard + Math.ceil(Math.random()*8);
    pCard = ++playersCard.innerHTML;

    oCard = 0;
    opponentsCard.innerHTML = oCard + Math.ceil(Math.random()*8);
    oCard = ++opponentsCard.innerHTML;

    tablesCard.innerHTML = 0;
    tCard = 0;
    tablesCard.innerHTML = tCard + Math.ceil(Math.random()*8);
    tCard = ++tablesCard.innerHTML;

    playerSum.innerHTML = tCard + pCard - 1;
    pSum = ++playerSum.innerHTML;

    opponentSum.innerHTML = tCard + oCard - 1;
    oSum = ++opponentSum.innerHTML;

    player.ready = false;

    clearInterval(countDownTimerId);//cancel the counter such that it doesn't keep running 
    nextRoundCountDown = 5;//this line and the one above are not interchangeable**
    cardDrawStartTime = 1;
    opponentPicked = false;//temp
    round++;
	startGime(currentLobby);
    roundOver = false;
}


//listeners for the buttons
rockBtn.addEventListener('click', () => {
    if(opponentPicked){
    player.changeSelection('r');
    roundRes1.innerHTML = "Hit.";
    roundRes2.innerHTML = null;
    tablesCard.innerHTML = tCard + Math.ceil(Math.random()*8);
    tCard = ++tablesCard.innerHTML;
    playerSum.innerHTML = tCard + pCard - 1;
    pSum = ++playerSum.innerHTML;
    //playerPicked = true;
    opponentPicked = false;
    if (pSum > 21){
        roundOver = true;
    }
}
});

scissorBtn.addEventListener('click', () => {
    player.changeSelection('s');
    roundRes1.innerHTML = "Stay.";
    roundRes2.innerHTML = null;
    socket.emit(
		'addAction',
		`Round #${round}: ${player.username} stayed.`
	);
    //playerPicked = false;
    player.ready = true;
    //removes all the buttons such that they can't be used if the player is ready
    //side note, there are several aways to accomplish this, though i picked this one as it works in the case of the game and the purpose of "removing them"
    rockBtn.style.display="none";
    scissorBtn.style.display="none";
});

async function startGime() {
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
	let action = `Round #${round}: ${opponent.username} stayed.`;
	console.log(action);

	// Wait for the opponent to shoot
	await socket.emit('waitForAction', currentLobby._id, action);
}

// When the user connects, join an available lobby!
// Emits either 'noLobbyFound', or 'lobbyFound'
socket.on('connect', async () => {
	console.log('Someone connected!');
	socket.emit('findAvailableLobby', 'BJack');
});

// Create a lobby if none is found.
// Emits 'createLobbySuccess' on creation
socket.on('noLobbyFound', async () => {
	console.log('No lobby found. Creating new lobby');
	socket.emit('createLobby', Date.now(), 'BJack', 2);
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
	startGime(currentLobby);
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
		startGime(currentLobby);
	}
	currentLobby = lobby;
	socket.emit('addAction', player.username + ' joined the lobby.');
	animate();
});

socket.on('actionFound', async (action) => {
	opponent.changeSelection(action.substring(action.lastIndexOf(':') + 1));
    if(action === 'r'){
    opponentPicked = true;
    }
	if(action === 's'){
	opponent.ready = true;
	}
});
//resetRound();
