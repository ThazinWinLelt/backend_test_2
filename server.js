if (process.env.NODE_ENV !== "production") {
  require("dotenv").load();
}

const express = require("express");
const app = express();
const expressLayouts = require("express-ejs-layouts");
const bodyParser = require("body-parser");
const expressSession = require("express-session");

const indexRouter = require("./routes/index");
const userRouter = require("./routes/users");

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.set("layout", "layouts/layout");
app.use(expressLayouts);
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: false }));
app.use(
  expressSession({ secret: "max", saveUninitialized: false, resave: false })
);

const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);
mongoose.set("runValidators", true); //Validation on Update
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", error => console.error(error));
db.once("open", () => console.log("Connected to Mongoose"));

app.use("/", indexRouter);
app.use("/user", userRouter);

app.listen(process.env.PORT || 3000);
