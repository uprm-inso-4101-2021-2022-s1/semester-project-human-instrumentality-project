const express = require("express");
const session = require("express-session");
const http = require("http");
const bcrypt = require("bcrypt");
const path = require("path");
const bodyParser = require("body-parser");
require("dotenv").config();
require("./models/db");
const app = express();
const server = http.createServer(app);
const User = require("./models/user");

// Global Session: not recommended and TEMPORARY
var sess;

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
app.use(express.static(path.join(__dirname, "./HIP Website")));

app.get("/", function (req, res) {
  sess = req.session;
  res.sendFile(path.join(__dirname, "./HIP Website/index.html"));
});

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
  res.redirect("/play.html");
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
        sess.username = user.username;
        sess.email = user.email;
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

  if (sess.username) {
    console.log("Goodbye " + req.session.username);
  } else {
    console.log("User isn't logged in!"); //this shoud technically never run since the log out button will only appear if you're logged in
  }

  // Destroy the session, and redirect to the main page
  sess.destroy();
  res.redirect("/index.html");
});

//When the user clicks the play button, depening if they are logged in or not they will be redirected to play page or login page respectively.
app.post("/play", async (req, res) => {
  sess = req.session;
  try {
    if (sess.username) {
      console.log("User is logged in, redirecting to play page");
      res.redirect("/play.html");
    } else {
      console.log("User is not logged in, redirecting to log in page");
      res.redirect("/login.html");
    }
  } catch {
    console.log("Whoops! hehe");
  }
});

server.listen(3000, function () {
  console.log("server is listening on port: 3000");
});
