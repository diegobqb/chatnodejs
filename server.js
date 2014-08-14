
var http = require("http");
var express = require("express");
var WebSocketServer = require('ws').Server;
//var q = require("q");
var fs = require("fs");

var connections = [ ];

var users = [ ];

function onWebSocketConnection(ws)
{
	console.log("web socket connected");
	
	connections.push(ws);
	users.push({user:"",chatRoom:""});
	
	ws.on("message", function(data) {
	
		console.log("message received: " + data);
		
		var newData = JSON.parse(data);
		
		switch(newData.type) {
			case "addUser" : addUser(newData, ws); break;
			case "chUser" : chUser(newData, ws); break;
			case "chChatRoom" : chChatRoom(newData, ws); break;
			case "msg" : msg(newData); break;
		}
		
		
		
	});
	ws.on("error", function() {
	
		console.log("web socket error");
		
		var user;
		var chatRoom;
		
		for (var i = 0; i < connections.length; ++i)
		{
			if (connections[i] == ws)
			{
				connections.splice(i, 1);
				
				user = users[i].user;
				chatRoom = users[i].chatRoom;
				
				users.splice(i, 1);
				break;
			}
		}
		
		var newData = {
			user:"*",
			chatRoom: chatRoom,
			message:"L'utilisateur '"+user+"' est déconnecté"
		};
	
		msg(newData);
	
	});
	ws.on("close", function() {
	
		console.log("web socket closed");
		
		for (var i = 0; i < connections.length; ++i)
		{
			if (connections[i] == ws)
			{
				connections.splice(i, 1);
				users.splice(i, 1);
				break;
			}
		}
		
	});
}

function msg(data, user) {
	var now = new Date();
	data.time = now.getHours() + ":" +now.getMinutes() + ":" + now.getSeconds();
	data.type = "msg";
	
		
	for (var i = 0; i < users.length; ++i)
	{
		if (users[i].user == user || users[i].chatRoom == data.chatRoom) {
			connections[i].send(JSON.stringify(data));
		}
	}
	
	if (user == null || user == undefined) {
		usersList();
	}
}

function sendUserList(data) {
	data.type = "userList";
	
	for (var i = 0; i < users.length; ++i)
	{
		if (users[i].chatRoom == data.chatRoom) {
			connections[i].send(JSON.stringify(data));
		}
	}
}

function usersList() {
	var chatRooms = [ ];
	
	for (var i = 0; i < users.length; ++i)
	{
		if (!contains(chatRooms, users[i].chatRoom)) {
			chatRooms.push(users[i].chatRoom);
		}
	}
	
	for (var i = 0; i < chatRooms.length; ++i)
	{
		var usersFromChatRoom = [ ];
		for (var j = 0; j < users.length; ++j) {
			if (users[j].chatRoom == chatRooms[i]) {
				usersFromChatRoom.push(users[j].user);
			}
		}
		var data = {
			chatRoom: chatRooms[i],
			users: usersFromChatRoom
		};
		
		process.nextTick(function(){
        	sendUserList(data);
    	});
	}
	
}

function addUser(data, ws) {
	for (var i = 0; i < connections.length; ++i)
	{
		if (connections[i] == ws)
		{
			users[i].user = data.user;
			users[i].chatRoom = data.chatRoom;
			break;
		}
	}
	
	var newData = {
		user:"*",
		chatRoom: data.chatRoom,
		message:"L'utilisateur '"+data.user+"' est entré dans la salle"
	};
	
	console.log("addUser user:"+data.user+" chatRoom:"+data.chatRoom);
	
	msg(newData);
	
	readWelcomeFile(data.chatRoom, ws);
}

function chUser(data, ws) {
	var oldName = "";
	
	for (var i = 0; i < connections.length; ++i)
	{
		if (connections[i] == ws)
		{
			if (users[i].user != data.user) {
				oldName = users[i].user;
				users[i].user = data.user;
				break;
			}
		}
	}
	
	if (oldName != "") {
		var newData = {
			user:"*",
			chatRoom: data.chatRoom,
			message:"L'utilisateur '"+oldName+"' a changé son nom pour '"+data.user+"'"
		};
	
		console.log("chUser oldName:"+oldName+" newName:"+data.user);
	
		msg(newData, null);
	}
}

function chChatRoom(data, ws) {
	var oldChatRoom = "";
	
	for (var i = 0; i < connections.length; ++i)
	{
		if (connections[i] == ws)
		{
			if (users[i].chatRoom != data.chatRoom) {
				oldChatRoom = users[i].chatRoom;
				users[i].chatRoom = data.chatRoom;
				break;
			}
		}
	}
	
	if (oldChatRoom != "") {
		var newData = {
			user:"*",
			chatRoom: oldChatRoom,
			message:"L'utilisateur '"+data.user+"' a quité la salle"
		};
	
		msg(newData, data.user);
		
		newData = {
			user:"*",
			chatRoom: data.chatRoom,
			message:"L'utilisateur '"+data.user+"' est entré dans la salle"
		};
	
		msg(newData, null);
		
		readWelcomeFile(data.chatRoom, ws);
	}
}

function contains(array, object) {
	for (var i = 0; i < array.length; ++i)  {
		if (array[i] == object) {
			return true;
		}
	}
	
	return false;
}

function readWelcomeFile(chatRoomName, ws) {
	fs.readFile(chatRoomName+".txt", {encoding: "utf-8"},function (err, data) {
	
		if (err) {
			console.log("file not found!");
		}
		else {
			console.log("==> "+data);
			var newData = {
				type: "welcome",
				user:"*",
				chatRoom: chatRoomName,
				message: data
			};
		
			for (var i = 0; i < connections.length; ++i)
			{
				if (connections[i] == ws)
				{
					connections[i].send(JSON.stringify(newData));
					break;
				}
			}	
		}
	});
}

function start_express_ws()
{
	var app = express();
	var server = http.createServer(app);
	var wss = new WebSocketServer({ server: server });
	
	app.use(express.static(__dirname + "/public"));
	wss.on('connection', onWebSocketConnection);
	server.listen(80);
	
	console.log("chat server started");
}

exports.start_express_ws = start_express_ws;
