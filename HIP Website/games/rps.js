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
    constructor(x,y,width,height,currentSelected,ready){
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


let player1 = new Player(canvas.width/8,canvas.height/4,canvas.width/14,canvas.width/14);
let opponent1 = new Opponent(canvas.width-canvas.width/4, canvas.height/4,canvas.width/14,canvas.width/14);

let pScore = 0;
let oScore = 0;
let roundOver = false;
let nextRoundCountDown = 5;


let animationId;
let countDownTimerId;
let opponentPicked = false;//temp

function animate(){

    //THIS IS TEMPORARY!!
    if(!opponentPicked){
        setTimeout(() => {
            const pick = Math.ceil(Math.random()*3);
            if(pick == 3){
                opponent1.changeSelection('r');
            }
            else if(pick == 2){
                opponent1.changeSelection('p');
            }
            else {//or 1
                opponent1.changeSelection('s');
            }
            opponent1.ready = true;
        }, 5* 1000);//5s
        opponentPicked = true;
    }    

    canvas.width = innerWidth;
    canvas.height = innerHeight;   
    
    animationId = requestAnimationFrame(animate);
    ctx.fillStyle = 'rgb(26, 24, 24)';//sets the color to the background color
    ctx.fillRect(0,0,canvas.width,canvas.height);//fills the background after every draw

    
    player1.update();
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
            nextRoundEl.innerHTML = "Next round in " + nextRoundCountDown + "...";
            if(nextRoundCountDown <= 0){
                resetRound();
            }
        }
        //check if the game is over
        opponent1.draw();

    }

    if(!opponent1.ready){
        opponentPickElement.innerHTML = "Picking...";
    }

    if(!player1.ready && opponent1.ready){
        opponentPickElement.innerHTML = "Picked!";
    }   
    
    if((opponent1.ready && player1.ready) && !roundOver){
        opponentPickElement.innerHTML = null;
        pickRoundkWinnerAndUdpateScore();
        roundOverCountDown();//calls the countdown only once since it has an interval in the inside!
        roundOver=true;
    }
}


function pickRoundkWinnerAndUdpateScore(){
    if(player1.currentSelected == opponent1.currentSelected){
        //tie
        roundRes1.innerHTML = "tie!";
        roundRes2.innerHTML = "tie!";
    }
    else if((player1.currentSelected == 'p' && opponent1.currentSelected == 'r') 
        || (player1.currentSelected == 'r' && opponent1.currentSelected == 's') 
        || (player1.currentSelected == 's' && opponent1.currentSelected == 'p')){
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


function resetRound(){
    player1.changeSelection('r');
    player1.ready = false; 
    
    opponent1.changeSelection('r');
    opponent1.ready = false;

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

    opponentPicked = false;//temp

    roundOver = false;
   
}


//listeners for the buttons
rockBtn.addEventListener('click', () => {
    player1.changeSelection('r');
});

paperBtn.addEventListener('click', () => {
    player1.changeSelection('p');
});

scissorBtn.addEventListener('click', () => {
    player1.changeSelection('s');
});

readyBtn.addEventListener('click', () => {
    player1.ready = true;

    //removes all the buttons such that they can't be used if the player is ready
    //side note, there are several aways to accomplish this, though i picked this one as it works in the case of the game and the purpose of "removing them"
    readyBtn.style.display="none";
    rockBtn.style.display="none";
    paperBtn.style.display="none";
    scissorBtn.style.display="none";
});

animate();