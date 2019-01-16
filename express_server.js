var express = require("express");
var app = express();
var PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandonID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandonID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const cookieParser = require("cookie-parser");
app.use(cookieParser());

/*
*   Get Endpoints
*/

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {

  res.render("urls_index", {urls: urlDatabase, username:req.cookies.username});
});

app.get("/urls/new", (req, res) => {

  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {

  res.render("urls_show", {shortURL: req.params.id});
});

app.get("/u/:shortURL", (req, res) => {

  let longURL = urlDatabase[req.params.shortURL];

  res.redirect(longURL);
});

app.get("/register", (req, res) => {

  res.render("urls_register");
});

app.get("/login", (req, res) => {


  res.render("urls_login");
});

/*
*   Post Endpoints
*/

app.post("/urls", (req, res) => {

  let shortUrl = generateRandomString();
  let newLink = "http://localhost:8080/urls/" + shortUrl;

  urlDatabase[shortUrl] = req.body.longURL;
  res.redirect(newLink);
});

app.post("/urls/:id/delete", (req, res) => {

  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {

  urlDatabase[req.params.id] = req.body.updatedURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {

  res.redirect("/urls");
});

app.post("/logout", (req, res) => {

  res.clearCookie("username");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {

  if (req.body.email === "" || req.body.password === "") {
    res.status(400);
    res.render("require_two_paras");
    return;
  }

  for(var user in users) {
    if (users[user].email === req.body.email) {
      res.status(400);
      res.render("duplicated_email");
      return;
    }
  }

  let userId = generateRandomString();
  let userInfo = {
    id: userId,
    email: req.body.email,
    password: req.body.password
  };

  users[userId] = userInfo;

  res.cookie("user_id", userId);
  res.redirect("/urls");

});

app.listen(PORT, () => {

  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {

  let randomStringLength = 6;

  let lowerCase = "abcdefghijklmnopqrstuvwxyz".split('');
  let captial = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
  let number = "0123456789".split('');

  let randomString = "";

  for (var i = 0; i < randomStringLength; i++) {
    let chooseType = Math.floor(Math.random() * 3 + 1);
    switch(chooseType) {
      case 1:
        randomString += lowerCase[Math.floor(Math.random() * 26)];
        break;
      case 2:
        randomString += captial[Math.floor(Math.random() * 26)];
        break;
      case 3:
        randomString += number[Math.floor(Math.random() * 10)];
        break;
      default:
        console.log("Something wrong.");
        break;
    }
  }

  return randomString;
}
