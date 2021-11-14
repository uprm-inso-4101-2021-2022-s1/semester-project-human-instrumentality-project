// Config
const http = require("http");
const path = require("path");

// Middleware
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieparser = require("cookie-parser");
const bcrypt = require("bcrypt");
const database = require("./models/db");
const app = express();
const server = http.createServer(app);
const User = require("./models/user");
const cors = require('cors');
const io = require('socket.io')(server);

const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGO_URI);

app.use(cors());

var lobbies;
let activeRoomId;

io.on('connection', (socket) => {

  socket.on('join', async (lobbyId, gameName) => {
    try{
      let lobby;
      let result = await lobbies.findOne({"name" : gameName, "player2": ""});//if there exists a lobby with that game that has no player2

      //if there is no lobby available it will create and join a new lobby
      if(!result){
        console.log("creating new lobby for " + gameName);
        await lobbies.insertOne(
          {
            "_id": lobbyId,
            name: gameName,
            player1: sess.username,
            player2: "",//since player2 hasn't joined (new lobby)
            actions: []
            });
        lobby = await lobbies.findOne({"_id": lobbyId});
      }else{//exists
        console.log("lobby exists")
        await lobbies.updateOne(result, {"$set": {player2: sess.username}});
        lobby = await lobbies.findOne({"player2": sess.username});//since a lobby exists, we can't find the lobby with the passed lobbyId, hence, we look for the one the player2 was just added to
      }
      
      // console.log(lobby);
      socket.join(lobby._id);
      socket.emit("joined", lobby._id, lobby.player1,lobby.player2);
      socket.activeRoom = lobby._id;
      activeRoomId = socket.activeRoom

    } catch(e) {
      console.error(e);
    }
  });


  socket.on('action', (action) => {
    lobbies.updateOne({"_id": socket.activeRoom}, {"$push": {"actions": action}});
    io.to(socket.activeRoom).emit("action", action);
  });

  socket.on('getOpponentShot', async (lobbyId, pName, oName) => {
    let done = false;
    try{
      while(!done){
        let tempLobby = await lobbies.findOne({"_id": lobbyId});
        let actions = tempLobby.actions;
        actions.forEach(a => {
          if(a.includes(oName + " shot")){
            socket.emit("opponentShot", a.substring(a.length-1));
            done = true;
          }
        });    
      }
    } catch(e){
      console.log("Lobby was most likely deleted, searching for actions failed.");
    }
  });

  socket.on("checkPlayer2", async (lobbyId) => {
    let tempName = "";
    try{
      while(tempName == ""){
        let tempLobby = await lobbies.findOne({"_id": lobbyId});
        tempName = tempLobby.player2;
      }
    } catch(e){
      console.log("Lobby was most likely deleted, searching for player2 failed.");
    }

    console.log("Player2 joined.");
    socket.emit("setPlayer2", (tempName));
  });

  socket.on('disconnect', (socket)=>{
    
    //for now, i made it such that if a player leaves, the lobby is removed
    lobbies.deleteOne({"_id":activeRoomId});
    console.log("Disconnected from that room.");
    
  });
});




// Global Session: not recommended and TEMPORARY
var sess;

app.set("views", path.join(__dirname, "HIP Website/views"));
app.set("view engine", "ejs");
app.use(
  session({
    // It holds the secret key for session
    secret: "Your_Secret_Key",

    // Forces the session to be saved
    // back to the session store
    resave: true,

    // Forces a session that is "uninitialized"
    // to be saved to the store
    saveUninitialized: true,
  })
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "HIP Website")));
app.use(cookieparser());


// Functions




// Redirect user to the parameter page and passes in the session username
// if present
function redirectToPageWithHeader(req, res, page) {
  sess = req.session;
  if (sess.username) {
    res.render(page, { username: sess.username });
  } else {
    res.render(page, { username: "" });
  }
}

// Redirects user to the page only if they are logged in
// or the user has a cookie present.
// Otherwise redirect to login page.
function redirectIfLoggedIn(req, res, pageIfLoggedIn) {
  sess = req.session;
  let pageToGoTo = pageIfLoggedIn
  let username = req.cookies.username;


  if (sess.username){}
  // If the user has a cookie present, log them in!
  else if (username) {
    console.log("Logging in as user: " + username);
    updateSession(sess, username, req.cookies.email);
  } else {
    pageToGoTo = "login";
    console.log("User is not logged in, redirecting to log in page");
  }
  redirectToPageWithHeader(req,res,pageToGoTo);
}

function updateSession(session, username, email) {
  session.username = username;
  session.email = email;
}

// EJS Page Redirection
// Try to keep them in alphabetical order!
// Also exclude partials pages!
app.get("/", async (req, res) => {
  res.redirect("/index");
});

app.get("/aboutus", async (req, res) => {
  redirectToPageWithHeader(req, res, "aboutus");
});

app.get("/avatarSelection", async (req, res) => {
  redirectIfLoggedIn(req, res, "avatarSelection");
});

app.get("/faq", async (req, res) => {
  redirectToPageWithHeader(req, res, "faq");
});

app.get("/forgotPassword", async (req, res) => {
  redirectToPageWithHeader(req, res, "forgotPassword");
});

app.get("/index", async (req, res) => {
  redirectToPageWithHeader(req, res, "index");
});

app.get("/login", async (req, res) => {
  redirectToPageWithHeader(req, res, "login");
});

app.get("/play", async (req, res) => {
  redirectIfLoggedIn(req, res, "play");
});

app.get("/profile", async (req, res) => {
  redirectIfLoggedIn(req, res, "profile");
});

app.get("/register", async (req, res) => {
  redirectToPageWithHeader(req, res, "register");
});

app.get("/resetPassword", async (req, res) => {
  redirectToPageWithHeader(req, res, "resetPassword");
});

// POST methods
app.post("/register", async (req, res) => {
  sess = req.session;
  try {
    const emailInUse = await User.isThisEmailInUse(req.body.email);
    const userNameInUse = await User.isThisUserNameInUse(req.body.username);

    if (!emailInUse && !userNameInUse) {
      let hashPassword = await bcrypt.hash(req.body.password, 10);
      const user = await User({
        username: req.body.username,
        email: req.body.email,
        password: hashPassword,
      });

      await user.save();
      res.redirect("/registrationSuccessful.html");
    } else {
      res.send(
        "<div align ='center'><h2>Email or username already used</h2></div><br><br><div align='center'><a href='./register.html'>Register again</a></div>"
      );
    }
  } catch {
    res.send("Internal server error");
  }
});

app.post("/loginAsGuest", async (req, res) => {
  const id = Date.now();
  sess.username = "Guest#" + id;
  res.redirect("/play");
});

app.post("/login", async (req, res) => {
  sess = req.session;
  try {
    const userNameInUse = await User.isThisUserNameInUse(req.body.username);

    if (userNameInUse) {
      let usernamePassed = req.body.username;
      let passwordPassed = req.body.password;

      const user = await User.findOne({ username: usernamePassed });
      const passwordsMatch = await user.passwordsMatch(passwordPassed);
      if (passwordsMatch) {
        updateSession(sess, user.username, user.email);

        if (req.body.remember){
          res.cookie("username", sess.username);
          res.cookie("email", sess.email);
        }
        res.redirect("/loginSuccessful.html");
      } else {
        res.send(
          "<div align ='center'><h2>Invalid username or password</h2></div><br><br><div align='center'><a href='./login.html'>login again<a><div>"
        );
      }
    } else {
      res.send(
        "<div align ='center'><h2>Invalid username or password</h2></div><br><br><div align='center'><a href='./login.html'>login again<a><div>"
      );
    }
  } catch {
    res.send("Internal server error");
  }
});

app.post("/logout", async (req, res) => {
  sess = req.session;
  res.clearCookie("username");
  res.clearCookie("email");
  if (sess.username) {
    console.log("Goodbye " + req.session.username);
  } else {
    // This shoud technically never run since the log out button will only appear if you're logged in
    console.log("User isn't logged in!");
  }

  // Destroy the session, and redirect to the main page
  sess.destroy();
  res.redirect("/");
});

// 404 page
app.use(function(req,res){
  redirectToPageWithHeader(req, res.status(404), "404");


});

server.listen(3000, async function(){
  console.log("server is listening on port: 3000");

  try{
    await client.connect();
    lobbies = client.db("HIP-DIB").collection("lobbies");
    console.log("connected to the HIP-DIB lobbies collection");
  }
  catch(e){
    console.log(e);
  }

});
