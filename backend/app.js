const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const dotenv = require("dotenv");

const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");

const app = express();
dotenv.config();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images");
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4());
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const MONGODB_URI = "yourURI";

app.use(cors({ origin: "*" }));

app.use(bodyParser.json());

app.use(multer({ storage: storage, fileFilter: fileFilter }).single("image"));

app.use("/images", express.static(path.join(__dirname, "images")));

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

app.use((error, req, res, next) => {
  const status = error.statusCode;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    const server = app.listen(8080);
    const io = require("./socket").init(server);
    io.on("connection", (socket) => {
      console.log("Client connected");
    });
  })
  .catch((err) => console.log(err));