var global_username = '';


/*** After successful authentication, show user interface ***/

var showUI = function() {
	$('div#chat').show();
	$('form#userForm').css('display', 'none');
	$('div#userInfo').css('display', 'inline');
	$('span#username').text(global_username);
 Aniways.init('sinch-js');
}


/*** If no valid session could be started, show the login interface ***/

var showLoginUI = function() {
	$('form#userForm').css('display', 'inline');
}


//*** Set up sinchClient ***/

sinchClient = new SinchClient({
	applicationKey: 'Your_app_key',
	capabilities: {messaging: true},
	//Note: For additional loging, please uncomment the three rows below
	//onLogMessage: function(message) {
	//	console.log(message);
	//}
});

/*** Name of session, can be anything. ***/

var sessionName = 'sinchSession-' + sinchClient.applicationKey;


/*** Check for valid session. NOTE: Deactivated by default to allow multiple browser-tabs with different users. Remove "false &&" to activate session loading! ***/

var sessionObj = JSON.parse(localStorage[sessionName] || '{}');
if(false && sessionObj.userId) { //Remove "false &&"" to actually check start from a previous session!
	sinchClient.start(sessionObj)
		.then(function() {
			global_username = sessionObj.userId;
			//On success, show the UI
			showUI();
		})
		.fail(function() {
			//No valid session, take suitable action, such as prompting for username/password, then start sinchClient again with login object
			showLoginUI();
		});
}
else {
	showLoginUI();
}


/*** Create user and start sinch for that user and save session in localStorage ***/

$('button#createUser').on('click', function(event) {
	event.preventDefault();
	$('button#loginUser').attr('disabled', true);
	$('button#createUser').attr('disabled', true);
	clearError();

	var signUpObj = {};
	signUpObj.username = $('input#username').val();
	signUpObj.password = $('input#password').val();

	//Use Sinch SDK to create a new user
	sinchClient.newUser(signUpObj, function(ticket) {
		//On success, start the client
		sinchClient.start(ticket, function() {
			global_username = signUpObj.username;
			//On success, show the UI
			showUI();

			//Store session & manage in some way (optional)
			localStorage[sessionName] = JSON.stringify(sinchClient.getSession());
		}).fail(handleError);
	}).fail(handleError);
});


/*** Login user and save session in localStorage ***/

$('button#loginUser').on('click', function(event) {
	event.preventDefault();
	$('button#loginUser').attr('disabled', true);
	$('button#createUser').attr('disabled', true);
	clearError();

	var signInObj = {};
	signInObj.username = $('input#username').val();
	signInObj.password = $('input#password').val();

	//Use Sinch SDK to authenticate a user
	sinchClient.start(signInObj, function() {
		global_username = signInObj.username;
		//On success, show the UI
		showUI();

		//Store session & manage in some way (optional)
		localStorage[sessionName] = JSON.stringify(sinchClient.getSession());
	}).fail(handleError);
});


/*** Send a new message ***/

var messageClient = sinchClient.getMessageClient();

$('button#sendMsg').on('click', function(event) {
	event.preventDefault();
	clearError();

	var recipients = $('input#recipients').val().split(' ');
	var text = $('input#message').val();

	//Create new sinch-message, using messageClient
	var sinchMessage = messageClient.newMessage(recipients, Aniways.encodeText(text));
	//Send the sinchMessage
	messageClient.send(sinchMessage).fail(handleError);
});


/*** Handle incoming messages ***/

var eventListener = {
	onIncomingMessage: function(message) {
		$('div#chatArea').append('<div class="msgRow" id="'+message.messageId+'"></div><div class="clearfix"></div>');

		$('div.msgRow#'+message.messageId)
			.attr('class', global_username == message.senderId ? 'me' : 'other')
			.append([
				'<div id="from">from: '+message.senderId+'</div>', 
				'<div class="aniways-message" id="textBody">'+message.textBody+'</div>',
				'<div class="recipients">delivered: </div>'
			]);
	}
}

messageClient.addEventListener(eventListener);


/*** Handle delivery receipts ***/ 

var eventListenerDelivery = {
	onMessageDelivered: function(messageDeliveryInfo) {
		$('div#'+messageDeliveryInfo.messageId+' div.recipients').append(messageDeliveryInfo.recipientId + ' ');
	}
}

messageClient.addEventListener(eventListenerDelivery);


/*** Log out user ***/

$('button#logOut').on('click', function(event) {
	event.preventDefault();
	clearError();

	//Stop the sinchClient
	sinchClient.stop();
	//Note: sinchClient object is now considered stale. Instantiate new sinchClient to reauthenticate, or reload the page.

	//Remember to destroy / unset the session info you may have stored
	delete localStorage[sessionName];

	//Reload page.
	window.location.reload();
});


/*** Handle errors, report them and re-enable UI ***/

var handleError = function(error) {
	//Enable buttons
	$('button#createUser').prop('disabled', false);
	$('button#loginUser').prop('disabled', false);

	//Show error
	$('div.error').text(error.message);
	$('div.error').show();
}

/** Always clear errors **/
var clearError = function() {
	$('div.error').hide();
}





