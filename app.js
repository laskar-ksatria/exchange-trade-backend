if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV === 'development') {
    require('dotenv').config();
};

const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const server = http.createServer(app);
const sokcetIo = require('socket.io');
const Io = sokcetIo(server);
const PORT = process.env.PORT;

//app.use
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());
app.use((req,res,next) => {
    req.Io = Io;
    next();
})

//mongo connect;
require('./db.config')();


server.listen(PORT, () => console.log(`Server started on ${PORT}`))