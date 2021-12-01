//const { name } = require("ejs");

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
    constructor(x,y,width,height){
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
    constructor(x,y,width,height){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.currentSelected = 'r';
        this.ready = false;
    }

    update(){
        opponent1.draw();
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
let player = new Player(canvas.width/8,canvas.height/4,canvas.width/14,canvas.width/14);
let opponent1 = new Opponent(canvas.width-canvas.width/4, canvas.height/4,canvas.width/14,canvas.width/14);

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
let playerPicked = false;
let opponentPicked = true;//temp


function animate(){
    
    //CPU Example
    if(opponentPicked && !player.ready){
        setTimeout(() => {
            if(oSum <= 17){
                roundRes2.innerHTML = "Hit.";
                roundRes1.innerHTML = null;
                opponentSum.innerHTML = tCard + oCard - 1;
                oSum = ++opponentSum.innerHTML;
                opponentPicked = false;
               }
               else {
                roundRes2.innerHTML = "Stay.";
                roundRes1.innerHTML = null;   
                opponent1.ready = true;
                opponentPicked = false;
               } 
            playerPicked = true;
        }, 1000);//1s
    }else if (player.ready && !playerPicked){
        setTimeout(() => {
            if(oSum <= 17){
                tablesCard.innerHTML = tCard + Math.ceil(Math.random()*8);
                tCard = ++tablesCard.innerHTML;
                opponentSum.innerHTML = tCard + oCard - 1;
                oSum = ++opponentSum.innerHTML;
               }
               else {
                opponent1.ready = true;   
               } 
        }, 1000);//1s
    }

    canvas.width = innerWidth;
    canvas.height = innerHeight;   
    
    animationId = requestAnimationFrame(animate);
    ctx.fillStyle = 'rgb(26, 24, 24)';//sets the color to the background color
    ctx.fillRect(0,0,canvas.width,canvas.height);//fills the background after every draw

    table1.update();
    player.update();
    opponent1.update();

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
            rockBtn.style.display="none";
            scissorBtn.style.display="none";
            nextRoundEl.innerHTML = "Next round in " + nextRoundCountDown + "...";
            if(nextRoundCountDown <= 0){
                resetRound();
            }
        }
        opponent1.draw();
    }
    

	if (player.ready && opponent1.ready && !roundOver) {
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
    player.ready = false;
    countDownTimerId = setInterval(() => {
        nextRoundCountDown--;
    },1000);//every second it ticks down the counter (1000 ms)
}



function resetRound(){
    player.changeSelection('r');
    player.ready = false; 
    opponent1.changeSelection('r');
    opponent1.ready = false;

    playerPicked = true;
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
    roundOver = false;
}


//listeners for the buttons
rockBtn.addEventListener('click', () => {
    if(playerPicked){
    player.changeSelection('r');
    roundRes1.innerHTML = "Hit.";
    roundRes2.innerHTML = null;
    tablesCard.innerHTML = tCard + Math.ceil(Math.random()*8);
    tCard = ++tablesCard.innerHTML;
    playerSum.innerHTML = tCard + pCard - 1;
    pSum = ++playerSum.innerHTML;
    if (pSum > 21){
        player.ready = true;
        opponent1.ready = true;
    }
    playerPicked = false;
    opponentPicked = true;
}
});

scissorBtn.addEventListener('click', () => {
    player.changeSelection('s');
    roundRes1.innerHTML = "Stay.";
    roundRes2.innerHTML = null;
    //removes all the buttons such that they can't be used if the player is ready
    //side note, there are several aways to accomplish this, though i picked this one as it works in the case of the game and the purpose of "removing them"
    rockBtn.style.display="none";
    scissorBtn.style.display="none";
    playerPicked = false;
    player.ready = true;
});

resetRound();
animate();
