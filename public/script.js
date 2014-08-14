
var ws = new WebSocket("ws://localhost");
ws.onopen = function(event)
{
	console.log("ws.onopen");
	console.log(event);
	var data = {
			type: "addUser",
			user: document.getElementById("user").value,
			chatRoom: document.getElementById("chatRoom").value
		};
		
	ws.send(JSON.stringify(data));
};
ws.onerror = function(event)
{
	console.log("ws.onerror");
	console.log(event);
};
ws.onmessage = function(event)
{
	console.log("ws.onmessage");
	console.log(event);
	
	var data = JSON.parse(event.data);
	
	switch(data.type) {
		case "msg" : receivedMessage(data); break;
		case "welcome" : welcome(data); break;
		case "userList" : updateUserList(data); break;
	}
	
};

function onSendMessage(event)
{
	if (event.keyCode == 13)
	{	
		var data = {
			type: "msg",
			user: document.getElementById("user").value,
			chatRoom: document.getElementById("chatRoom").value,
			message: document.getElementById("message").value
		};
		
		ws.send(JSON.stringify(data));
			
		document.getElementById("message").value = "";
		document.getElementById("message").blur();
	}
}

function onChangeUserKey(event)
{	
	if (event.keyCode == 13)
	{	
		onChangeUser(event);
	}
}

function onChangeUser(event)
{
	if (document.getElementById("user").value == "") {
		document.getElementById("user").value = "Invité";
	}
	
	var data = {
		type: "chUser",
		user: document.getElementById("user").value,
		chatRoom: document.getElementById("chatRoom").value
	};
	
	ws.send(JSON.stringify(data));
}

function onChatRoomKey(event)
{	
	if (event.keyCode == 13)
	{	
		onChatRoom(event);
	}
}

function onChatRoom(event)
{
	if (document.getElementById("chatRoom").value == "") {
		document.getElementById("chatRoom").value = "Générale";
	}
	
	var data = {
		type: "chChatRoom",
		user: document.getElementById("user").value,
		chatRoom: document.getElementById("chatRoom").value
	};
	
	ws.send(JSON.stringify(data));
}

function receivedMessage(data) {
	var output = document.getElementById("output");
	
	output.value += "[ "+data.chatRoom+" "+data.time+" ]";
	if (document.getElementById("user").value != data.user) {
		output.value += " < "+data.user+" >";
	}
	output.value += " "+data.message;
	output.value += "\n";
}

function welcome(data) {
	alert(data.message);
}

function updateUserList(data) {
	console.log("updateUserList");
	var userList = document.getElementById("userList");
	userList.value = "";
	
	for (var i = 0; i < data.users.length; ++i) {
		userList.value += data.users[i]+"\n";
	}
}