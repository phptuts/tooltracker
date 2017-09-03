const express = require('express');
const app = express();

var server = require('http').Server(app);
var io = require('socket.io')(server);
var bodyParser = require('body-parser');
var isConnected = false;
var redis = require("redis");

var redisClient = redis.createClient();

app.use(bodyParser.json());
app.use('/socket.io', express.static(__dirname + '/node_modules/socket.io-client/dist/'));

server.listen(1243);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/edit_add_tool', function (req, res) {
    res.sendFile(__dirname + '/edit_add_tool.html');
});

app.post('/rfid-scan', function (req, res) {
    if (isConnected) {

        redisClient.get(req.body.rfid,function(err,reply) {

            var tool = reply == null ? null : JSON.parse(reply).tool;

            io.emit('rfid-sent', {'rfid': req.body.rfid, tool: tool});
        });

        res.send('sent');

        return;
    }

    res.send('not-sent');
});

app.post('/rfid-tool', function (req, res) {
    console.log(req.body);
    redisClient.set(req.body.rfid, JSON.stringify({'tool': req.body.tool, 'checked': false}));

    res.send('ok');
});


app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
});

io.on('connection', function (socket) {
    console.log('connected to socket!!');
    isConnected = true;
});

redisClient.on("error", function (err) {
    console.log("Error " + err);
});

redisClient.on('ready',function() {
    console.log("Redis is ready");
});