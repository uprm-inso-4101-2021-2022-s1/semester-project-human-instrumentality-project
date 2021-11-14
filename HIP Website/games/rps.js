const socket = io("http://localhost:3000", { autoConnect: false });

const canvas = document.getElementById('canvasrps');
const ctx = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;

//options
const rockBtn = document.getElementById('rock');
const paperBtn = document.getElementById('paper');
const scissorBtn = document.getElementById('scissors');

//ready
const readyBtn = document.getElementById('ready');

//images
var rockImg = new Image();
rockImg.src = "../images/rock1.png";
var paperImg = new Image();
paperImg.src = "../images/paper1.png";
var scissorImg = new Image();
scissorImg.src = "../images/scissor1.png";

//opponent
const opponentPickElement = document.getElementById("opponentsPick");

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
class Player{
    constructor(name, x,y,width,height){
        this.name = name;
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
        this.x = canvas.width/8;
        this.y = canvas.height/4;
        this.width = canvas.width/14;
        this.height = canvas.width/14;
    }

    draw(){
        ctx.beginPath();

        if(this.currentSelected=='r'){
            ctx.drawImage(rockImg,this.x,this.y,this.width*2,this.height*2);
        }
        else if(this.currentSelected=='p'){
            ctx.drawImage(paperImg,this.x,this.y,this.width*2,this.height*2);
        }        
        else{//or 's'
            ctx.drawImage(scissorImg,this.x,this.y,this.width*2,this.height*2);
        }

        ctx.fill();
    }

    changeSelection(newSelection){
        this.currentSelected=newSelection;
    }
}


class Opponent{
    constructor(name, x,y,width,height,){
        this.name = name;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.currentSelected = 'r';
        this.ready = false;
    }

    update(){
        //should search for a change of the choice in the databaase and if they player clicked ready
        //this resets the x,y,width, and height properties of the opponent every update 
        //it makes sure that if the screen is resized it keeps the same ratio and not the original values
        this.x = canvas.width - canvas.width/4;
        this.y = canvas.height/4;
        this.width = canvas.width/14;
        this.height = canvas.width/14;
    }
    
    draw(){
       if(this.ready){
        ctx.beginPath();

        if(this.currentSelected=='r'){
            ctx.drawImage(rockImg,this.x,this.y,this.width*2,this.height*2);
        }
        else if(this.currentSelected=='p'){
            ctx.drawImage(paperImg,this.x,this.y,this.width*2,this.height*2);
        }        
        else{
            ctx.drawImage(scissorImg,this.x,this.y,this.width*2,this.height*2);
        }

        ctx.fill();
       } 
    }

    changeSelection(newSelection){
        this.currentSelected=newSelection;
    }
}


let pScore = 0;
let oScore = 0;
let roundOver = false;
let nextRoundCountDown = 5;

let animationId;
let countDownTimerId;

//the names are set later once players join*
let player = new Player("", canvas.width/8,canvas.height/4,canvas.width/14,canvas.width/14);
let opponent = new Opponent("", canvas.width-canvas.width/4, canvas.height/4,canvas.width/14,canvas.width/14);

let lobbyID;


function animate(){
    canvas.width = innerWidth;
    canvas.height = innerHeight;   
    
    animationId = requestAnimationFrame(animate);
    ctx.fillStyle = 'rgb(26, 24, 24)';//sets the color to the background color
    ctx.fillRect(0,0,canvas.width,canvas.height);//fills the background after every draw

    
    player.update();
    opponent.update();
    if(roundOver){
        //if the round is over, first verify if the game is over before starting a new round
        if(pScore == 3){
            nextRoundEl.innerHTML = "You won!! Redirecting to play page in " + nextRoundCountDown + "...";
            if(nextRoundCountDown <= 0){
                //move to the play page
                window.location = '/play';
            }
        }
        else if(oScore == 3){
            nextRoundEl.innerHTML = "You Lost!! Redirecting to play page in " + nextRoundCountDown + "...";
            if(nextRoundCountDown <= 0){
                //move to the play page
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

    if(opponent.name == ""){
        opponentPickElement.innerHTML = "Waiting on opponent to join...";
    }
    else if(!opponent.ready){
        opponentPickElement.innerHTML = "Picking...";
    }

    else if(!player.ready && opponent.ready){
        opponentPickElement.innerHTML = "Picked!";
    }   
    
    else if((player.ready && opponent.ready) && !roundOver){
        opponentPickElement.innerHTML = null;
        pickRoundkWinnerAndUdpateScore();
        roundOverCountDown();//calls the countdown only once since it has an interval in the inside!
        roundOver=true;
    }
}


function pickRoundkWinnerAndUdpateScore(){
    if(player.currentSelected == opponent.currentSelected){
        //tie
        roundRes1.innerHTML = "tie!";
        roundRes2.innerHTML = "tie!";
    }
    else if((player.currentSelected == 'p' && opponent.currentSelected == 'r') 
        || (player.currentSelected == 'r' && opponent.currentSelected == 's') 
        || (player.currentSelected == 's' && opponent.currentSelected == 'p')){
        //player wins
        playersScore.innerHTML = ++pScore;
        roundRes1.innerHTML = "Round Winner!";
        roundRes2.innerHTML = null;
    }
    else{
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


async function resetRound(){
    player.changeSelection('r');
    player.ready = false; 
    
    opponent.changeSelection('r');
    opponent.ready = false;

    //refer to the side note in inside the event listener for the ready btn 
    readyBtn.style.display="initial";
    rockBtn.style.display="initial";
    paperBtn.style.display="initial";
    scissorBtn.style.display="initial";
    
    roundRes1.innerHTML = null;
    roundRes2.innerHTML = null;

    nextRoundEl.innerHTML = null;

    clearInterval(countDownTimerId);//cancel the counter such that it doesn't keep running 
    nextRoundCountDown = 5;//this line and the one above are not interchangeable**

    //new round, check if opponent shot again (starts the loop on "app.js")
    await socket.emit("getOpponentShot", lobbyID, player.name, opponent.name);
    roundOver = false;
   
}


//listeners for the buttons
rockBtn.addEventListener('click', () => {
    player.changeSelection('r');
});

paperBtn.addEventListener('click', () => {
    player.changeSelection('p');
});

scissorBtn.addEventListener('click', () => {
    player.changeSelection('s');
});

readyBtn.addEventListener('click', () => {
    socket.emit("action", player.name + " shot " + player.currentSelected);
    player.ready = true;

    //removes all the buttons such that they can't be used if the player is ready
    //side note, there are several aways to accomplish this, though i picked this one as it works in the case of the game and the purpose of "removing them"
    readyBtn.style.display="none";
    rockBtn.style.display="none";
    paperBtn.style.display="none";
    scissorBtn.style.display="none";
});


//socket listeners
socket.connect();

socket.on("connect", async () => {
    socket.emit("join", Date.now(), "RPS");

});


socket.on("joined", async (lobbyId, player1, player2) =>{
    if(player2 == ""){//then "this" joined as the player1
        player.name = player1;
        pNameEl.innerHTML = player1;
        //start a loop in app.js that looks for when player2 joins
        await socket.emit('checkPlayer2', (lobbyId));
        //opponent's name stays empty

    }else{//then "this" joined as the player2
        player.name = player2;
        opponent.name = player1;
        pNameEl.innerHTML = player1;
        oNameEl.innerHTML = player2;
        //call the actions since both players are now inside the section
        await socket.emit("getOpponentShot", lobbyId, player.name, opponent.name);
        //if this doesn't make sense or seems confusing please feel free to ask^
    }

    lobbyID = lobbyId;
    console.log(lobbyID);

    socket.emit('action', player.name +  " joined the lobby.");
    animate();
});


socket.on("setPlayer2", async (player2) =>{//gets back the opponent if he joined
    console.log(player2 + "joined");
    opponent.name = player2;
    oNameEl.innerHTML = player2;
    //call the actions since both players are now inside the section
    await socket.emit("getOpponentShot", lobbyID, player.name, opponent.name);
    
});


socket.on("opponentShot", (opChoice) =>{
    opponent.changeSelection(opChoice);
    opponent.ready = true;
});