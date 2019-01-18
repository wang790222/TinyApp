
var PORT = 8080; // default port 8080

const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cookieSession({
  secret: process.env.SESSION_SECRET
}));

const urlDatabase = {
  userRandomID: {
    "b2xVn2":
      [ "http://www.lighthouselabs.ca", "2019-1-1 20:10:30", 5, ["a", "b", "c"] ],
    "9sm5xK":
      [ "http://www.google.com", "2019-1-19 20:10:30", 3, ["d", "e", "f"] ]
  }, user2RandomID: {
    "b2xVn2": [ "http://www.lighthouselabs.ca", "2019-1-18 20:10:30", 5, { "visitors": ["a", "b", "c"] } ]
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("1", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("2", 10)
  }
};

/**
*   Get Endpoints
*/

app.get("/", (req, res) => {

  if (req.session.user_id === undefined) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

app.get("/urls", (req, res) => {

  let user_id = req.session.user_id;

  if (!isLogin(res, user_id)) {
    return;
  }

  let templateVars = {urlsInfo: urlsForUser(user_id), user: users[user_id]};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {

  let user_id = req.session.user_id;

  if (!isLogin(res, user_id)) {
    return;
  }
  res.render("urls_new", {user: users[req.session.user_id]});
});

app.get("/urls/:id", (req, res) => {

  let user_id = req.session.user_id;

  if (!isLogin(res, user_id)) {
    return;
  }

  for (var user in urlDatabase) {
    if (req.params.id in urlDatabase[user]) {
      if (user_id === user) {
        let templateVars = {
          shortURL: req.params.id,
          urlsInfo: urlDatabase[user_id][req.params.id],
          user: users[user_id]
        };
        res.render("urls_show", templateVars);
        return;
      } else {
        res.send("<script> alert(\"This short url does not belong you\");</script>");
        return;
      }
    }
  }
  res.send("<script> alert(\"This short url does not exist\");</script>");
});

app.get("/u/:id", (req, res) => {

  let shortUrl = req.params.id;

  for (var user in urlDatabase) {
    if (shortUrl in urlDatabase[user]) {
      urlDatabase[user][shortUrl][2]++;
      urlDatabase[user][shortUrl][3] = updateUniqueVisit(req, urlDatabase[user][shortUrl][3]);
      res.redirect(urlDatabase[user][shortUrl][0]);
      return;
    }
  }

  res.send("<script> alert(\"This shor url does not exist\");</script>");
});

app.get("/register", (req, res) => {

  let user_id = req.session.user_id;

  if (user_id === undefined) {
    res.render("urls_register");
    return;
  } else {
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {

  let user_id = req.session.user_id;

  if (user_id === undefined) {
    res.render("urls_login", {user: user_id});
    return;
  } else {
    res.redirect("/urls");
  }
});

/**
*   Post Endpoints
*/

app.post("/urls", (req, res) => {

  let user_id = req.session.user_id;
  let shortUrl = generateRandomString();

  if (!isLogin(res, user_id)) {
    return;
  }

  urlDatabase[user_id][shortUrl] = getUrlInfo(req.body.longURL);
  res.redirect(`/urls/${shortUrl}`);
});

app.post("/urls/:shortUrl/delete", (req, res) => {

  let user_id = req.session.user_id;

  if (!isLogin(res, user_id)) {
    return;
  }

  delete urlDatabase[req.session.user_id][req.params.shortUrl];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {

  let user_id = req.session.user_id;

  if (!isLogin(res, user_id)) {
    return;
  }

  urlDatabase[user_id][req.params.id][0] = req.body.updatedURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {

  if (req.body.email === "" || req.body.password === "") {
    res.status(403).send("<html>Please make sure filled email and password</html>");
    return;
  }

  for(var user in users) {
    if (users[user].email === req.body.email) {
      if (!bcrypt.compareSync(req.body.password, users[user].password)) {
        res.status(403).send("<html>Please make sure the password is correct</html>");
        return;
      } else {
        req.session.user_id = users[user].id;
        res.redirect("/urls");
        return;
      }
    }
  }
  res.status(403).send("<html>Email does not exist</html>");
});

app.post("/logout", (req, res) => {

  delete req.session.user_id;
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
    password: bcrypt.hashSync(req.body.password, 10)
  };

  users[userId] = userInfo;
  urlDatabase[userId] = {};

  req.session.user_id = userId;
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

function getUrlInfo(longUrl) {

  let currentTime = new Date();
  let currentTimeStr = `${currentTime.getFullYear()}-${currentTime.getMonth() + 1}-${currentTime.getDate()} ${currentTime.getHours()}:${currentTime.getMinutes()}:${currentTime.getSeconds()}`;
  let urlInfo = [longUrl, currentTimeStr, 0, []];
  return urlInfo;
}

function updateUniqueVisit(req, uniqueVisit) {

  let ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

  for (var uniqueIp of uniqueVisit) {
    if (uniqueIp === ip) {
      return uniqueVisit;
    }
  }

  let newUniqueVisit = uniqueVisit;
  newUniqueVisit.push(ip);
  return newUniqueVisit;
}