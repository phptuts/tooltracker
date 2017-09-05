const express = require('express');
const app = express();
const fs = require('fs');

var server = require('http').Server(app);
var io = require('socket.io')(server);
var bodyParser = require('body-parser');
var isConnected = false;
var Db = require('tingodb')().Db;

var db = new Db('./', {});
var toolCollection = db.collection("tools");


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

        toolCollection.findOne({'rfid': req.body.rfid}, function (err, tool) {
            var toolName = tool == null ? null : tool.name;

            io.emit('rfid-sent', {'rfid': req.body.rfid, tool: toolName});

        });

        res.send('sent');

        return;
    }

    res.send('not-sent');
});

app.put('/tool-checkout', function (req, res) {

    toolCollection.findOne({rfid: req.body.rfid}, function (err, tool) {

        var message = 'Tool Not Found.';

        if (typeof tool !== 'undefined') {
            tool.checked = !tool.checked;
            toolCollection.update({rfid: tool.rfid}, { $set: tool }, function (err, item) {
                console.log(err, 'UPDATE ERROR');
            });
            if (isConnected) {
                io.emit('refresh_tools', {});
            }
            message = tool.checked ?
                "You are checking out the " + tool.name + "." : "Thank you for returning the " + tool.name + ".";
        }

        console.log(message);

        res.send(message);

    });

});

app.post('/rfid-tool', function (req, res) {
    console.log(req.body);
    toolCollection.findOne({rfid: req.body.rfid}, function (err, tool) {

        if (typeof tool !== 'undefined') {
            tool.name = req.body.tool;
            toolCollection.update({rfid: tool.rfid}, { $set: tool }, function (err, item) {
                console.log(err, 'UPDATE ERROR');
            });
            return;
        }

        tool = {};
        tool.name = req.body.tool;
        tool.rfid = req.body.rfid;
        tool.checked = false;

        toolCollection.insert(tool);
        if (isConnected) {
            io.emit('refresh_tools', {});
        }
    });

    res.send('ok');
});

app.get('/tool-list', function (req, res) {

    toolCollection.find().toArray(function (err, tools) {
        res.json(tools);
    });


});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
});

io.on('connection', function (socket) {
    console.log('connected to socket!!');
    isConnected = true;
});

