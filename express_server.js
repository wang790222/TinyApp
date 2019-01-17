var express = require("express");
var app = express();
var PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const urlDatabase = {
  userRandomID: {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
  }, user2RandomID: {
    "b2xVn2": "http://www.lighthouselabs.ca",
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "1"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "2"
  }
};

/*
*   Get Endpoints
*/

app.get("/", (req, res) => {

  if (req.cookies.user_id === undefined) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

app.get("/urls", (req, res) => {

  let user_id = req.cookies.user_id;

  if (!isLogin(res, user_id)) {
    return;
  }

  let templateVars = {urls: urlsForUser(user_id), user: users[user_id]};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {

  let user_id = req.cookies.user_id;

  if (!isLogin(res, user_id)) {
    return;
  }
  res.render("urls_new", {user: users[req.cookies.user_id]});
});

app.get("/urls/:id", (req, res) => {

  let user_id = req.cookies.user_id;
  let shortUrlExist = false;

  if (!isLogin(res, user_id)) {
    return;
  }

  for (var user in users) {
    if (req.params.id in urlsForUser(user)) {
      if (user_id === user) {
        res.render("urls_show", {
        shortURL: req.params.id,
        longURL: urlsForUser(user_id)[req.params.id],
        user: users[user_id]
        });
        return;
      } else {
        shortUrlExist = true;
      }
    }
  }

  if(shortUrlExist) {
    res.send("<script> alert(\"This short url does not belong you\");</script>");
    return;
  } else {
    res.send("<script> alert(\"This short url does not exist\");</script>");
    return;
  }
});

app.get("/u/:id", (req, res) => {

  let longURL = urlDatabase[req.cookies.user_id][req.params.id];

  if (longURL !== undefined) {
    res.redirect(longURL);
  } else {
    res.send("<script> alert(\"This shor url does not exist\");</script>");
  }
});

app.get("/register", (req, res) => {

  let user_id = req.cookies.user_id;

  if (user_id === undefined) {
    res.render("urls_register");
    return;
  } else {
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {

  let user_id = req.cookies.user_id;

  if (user_id === undefined) {
    res.render("urls_login");
    return;
  } else {
    res.redirect("/urls");
  }
});

/*
*   Post Endpoints
*/

app.post("/urls", (req, res) => {

  let user_id = req.cookies.user_id;
  let shortUrl = generateRandomString();

  if (!isLogin(res, user_id)) {
    return;
  }
  urlDatabase[user_id][shortUrl] = req.body.longURL;
  res.redirect(`/urls/${shortUrl}`);
});

app.post("/urls/:shortUrl/delete", (req, res) => {

  let user_id = req.cookies.user_id;

  if (!isLogin(res, user_id)) {
    return;
  }
  delete urlDatabase[req.cookies.user_id][req.params.shortUrl];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {

  let user_id = req.cookies.user_id;

  if (!isLogin(res, user_id)) {
    return;
  }
  urlDatabase[req.cookies.user_id][req.params.id] = req.body.updatedURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {

  if (req.body.email === "" || req.body.password === "") {
    res.status(403).send("<html>Please make sure filled email and password</html>");
    return;
  }

  for(var user in users) {
    if (users[user].email === req.body.email) {
      if (users[user].password !== req.body.password) {
        res.status(403).send("<html>Please make sure the password is correct</html>");
        return;
      } else {
        res.cookie("user_id", users[user].id);
        res.redirect("/urls");
        return;
      }
    }
  }
  res.status(403).send("<html>Email does not exist</html>");
});

app.post("/logout", (req, res) => {

  res.clearCookie("user_id");
  res.redirect("/login");
});

app.post("/register", (req, res) => {

  if (req.body.email === "" || req.body.password === "") {
    res.status(400).render("require_two_paras");
    return;
  }

  for(var user in users) {
    if (users[user].email === req.body.email) {
      res.status(400).render("duplicated_email");
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
  urlDatabase[userId] = {};

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

function urlsForUser(id) {
  return (urlDatabase[id] === undefined) ? {} : urlDatabase[id];
}

function isLogin(res, userId) {
  if (userId === undefined) {

    res.status(403).send("<script> alert(\"Please Login\");</script>");
    return false;
  }

  return true;
}