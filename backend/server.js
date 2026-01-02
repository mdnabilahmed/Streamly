const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

dotenv.config();
const app = express();

app.listen(8080, () => {
    console.log("Server is running on port 8080");
});