const express = require("express");
const pdf = require("pdfkit"); //download pdf
const fs = require("fs"); //download pdf
var path = require("path"); //download pdf
const router = express.Router();
const User = require("../models/user");
const Tag = require("../models/tag");
var crypto = require("crypto");

const Transaction = require("mongoose-transactions");
const transaction = new Transaction();

router.get("/register", (req, res) => {
  const user = {
    password: "",
    firstname: "",
    lastname: "",
    gender: "M",
    email: "",
    phone: "",
    isAdmin: false
  };

  res.render("users/register", { user: user, skills: "" });
});

router.get("/", (req, res) => {
  res.render("users/login");
});

router.get("/logout", (req, res) => {
  req.session.destroy();

  var myDoc = new pdf();

  myDoc.pipe(fs.createWriteStream(__dirname + "/../public/download/node.pdf"));
  myDoc
    .font("Times-Roman")
    .fontSize(12)
    .text("", 30, 30);
  myDoc.end();

  res.render("users/login");
});

router.get("/edit_cancel", (req, res) => {
  res.render("users/index");
});

router.get("/edit", async (req, res) => {
  var login = req.session.login;

  let keyword = {};
  let user = {};
  let skills = {};

  try {
    keyword.login = login;

    await User.findOne(keyword, function(error, result) {
      if (error) {
        res.send(error);
      }
      user = result;
    });

    await Tag.findOne(keyword, function(error, result) {
      if (error) {
        res.send(error);
      }
      skills = result.tagname.split(",");
    });

    res.render("users/edit", { user: user, skills: skills });
  } catch (err) {
    res.send(err);
  }
});

router.post("/register", (req, res) => {
  const user = "User";
  const tag = "Tag";

  let msg = [];
  msg = validate(req.body);

  var rdm = crypto.randomBytes(20).toString("hex");

  const userObj = {
    login: req.body.firstname + "." + req.body.lastname + "." + rdm,
    password: req.body.password,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    gender: req.body.gender,
    email: req.body.email,
    phone: req.body.phone,
    isAdmin: false
  };

  var skill = "";
  if (req.body.skills != undefined && req.body.skills != null) {
    skill = req.body.skills.toString();
  } else {
    msg.push("skill is required");
  }

  const tagObj = {
    login: req.body.firstname + "." + req.body.lastname + "." + rdm,
    tagname: skill
  };

  async function start() {
    try {
      const userId = transaction.insert(user, userObj);
      const tagId = transaction.insert(tag, tagObj);
      const final = await transaction.run();
      transaction.clean();

      res.render("users/login", {
        user: "",
        skills: "",
        message: ["user successfully registered with id = " + userObj.login]
      });
    } catch (error) {
      await transaction.rollback().catch(console.error);
      transaction.clean();

      // var message = error.error.message;
      // if (message.indexOf("User validation failed: ") != -1) {
      //   var message = message.replace("User validation failed: ", "");
      // }
      // if (message.indexOf("Tag validation failed: ") != -1) {
      //   var message = message.replace("Tag validation failed: ", "");
      // }
      // var msg = message.split(", ");

      res.render("users/register", {
        user: userObj,
        skills: req.body.skills,
        message: msg
      });
    }
  }

  start();
});

router.post("/login", async (req, res) => {
  var login = req.body.login;
  var password = req.body.password;

  let keyword = {};
  var allUser = "";

  try {
    keyword.login = login;
    keyword.password = password;

    var skill = {};
    await Tag.find({}, function(err, res) {
      if (err) {
        res.send(err);
      }

      res.forEach(function(data, index, arr) {
        skill[data.login] = data.tagname;
      });
    });

    await User.find({}, function(error, result) {
      if (error) {
        res.send(error);
      }

      result.forEach(function(data, index, arr) {
        allUser += "User: #" + (index + 1) + "\n" + pdfFormat(data);
        allUser += "skill = " + skill[data.login] + "\n";
        if (result.length - 1 != index) {
          allUser += "\n\n";
        }
      });
    });

    await User.findOne(keyword, function(error, result) {
      if (error) {
        res.send(error);
      }

      if (result) {
        req.session.login = result.login;

        if (result.isAdmin == true) {
          var myDoc = new pdf();

          myDoc.pipe(
            fs.createWriteStream(__dirname + "/../public/download/node.pdf")
          );
          myDoc
            .font("Times-Roman")
            .fontSize(12)
            .text(allUser, 30, 30);
          myDoc.end();
        }
        res.render("users/index", {
          result: result
        });
      }
      res.render("users/login", { message: ["login fail"] });
    });
  } catch (err) {
    res.send(err);
  }
});

router.post("/edit", async (req, res) => {
  let msg = [];
  msg = validate(req.body);

  const userObj = {
    password: req.body.password,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    gender: req.body.gender,
    email: req.body.email,
    phone: req.body.phone
  };

  var skill = "";
  if (req.body.skills != undefined && req.body.skills != null) {
    skill = req.body.skills.toString();
  } else {
    msg.push("skill is required");
  }

  const tagObj = {
    tagname: skill
  };

  var user = {};
  var tag = {};

  try {
    await User.findOne({ login: req.session.login }, function(error, result) {
      if (error) {
        res.send(error);
      }
      if (result) {
        user = result;
      }
    });
  } catch (err) {
    res.send(err);
  }
  try {
    await Tag.findOne({ login: req.session.login }, function(error, result) {
      if (error) {
        res.send(error);
      }
      if (result) {
        tag = result;
      }
    });
  } catch (err) {
    res.send(err);
  }

  async function start() {
    console.log(userObj);
    console.log(tagObj);
    try {
      transaction.update("User", user._id, userObj);
      transaction.update("Tag", tag._id, tagObj);
      await transaction.run();
      transaction.clean();

      res.render("users/index", { result: user });
    } catch (error) {
      await transaction.rollback().catch(console.error);
      transaction.clean();

      res.render("users/edit", {
        user: userObj,
        skills: req.body.skills,
        message: msg
      });
    }
  }

  if (user && tag) {
    start();
  }
});

router.get("/download", (req, res) => {
  var file = path.join(__dirname, "/../public/download/node.pdf");
  res.download(file, function(err) {
    if (err) {
      console.log(err);
    }
  });
});

function validate(arg) {
  var msg = [];

  if (arg.firstname == "") {
    msg.push("First name is required.");
  }

  if (arg.firstname != "" && !arg.firstname.match(/^[a-zA-Z]+$/)) {
    msg.push("First name is invalid.");
  }

  if (arg.lastname == "") {
    msg.push("Last name is required.");
  }

  if (arg.lastname != "" && !arg.lastname.match(/^[a-zA-Z]+$/)) {
    msg.push("Last name is invalid.");
  }

  if (arg.password == "") {
    msg.push("Password is required.");
  }

  if (arg.email == "") {
    msg.push("Email is required.");
  }

  if (arg.email != "" && !arg.email.match(/\S+@\S+\.\S+/)) {
    msg.push("Email is invalid.");
  }

  if (arg.phone == "") {
    msg.push("Phone is required.");
  }

  if (
    arg.phone != "" &&
    !arg.phone.match(/[+][(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*/)
  ) {
    msg.push("Phone is invalid.");
  }

  if (!["M", "F"].includes(arg.gender)) {
    msg.push("Gender is invalid.");
  }

  return msg;
}

function pdfFormat(data) {
  var format = "";

  format += "id = " + data._id + "\n";
  format += "login = " + data.login + "\n";
  format += "password = " + data.password + "\n";
  format += "firstname = " + data.firstname + "\n";
  format += "lastname = " + data.lastname + "\n";
  format += "gender = " + data.gender + "\n";
  format += "email = " + data.email + "\n";
  format += "phone = " + data.phone + "\n";
  format += "isAdmin = " + data.isAdmin + "\n";
  format += "createdAt = " + data.createdAt + "\n";
  format += "updatedAt = " + data.updatedAt + "\n";

  return format;
}

module.exports = router;
