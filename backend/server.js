require('module-alias/register');
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

//Connect to database
require("./db");

const mainRouter = require("./routes/mainRouter");

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use("/", mainRouter);

app.listen(8080, () => {
    console.log("Server is running on port 8080");
});