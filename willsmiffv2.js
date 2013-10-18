var config = require("./config.js")("config.json");
var ttapi = require("ttapi");
var bot = new ttapi(config.get("turntable:auth"), config.get("turntable:userId"), config.get("turntable:roomId"));
var timer = require("./timer.js")(config, bot);
var commands = require("./commands.js")(config, bot, timer);
var handy = require("./handy.js")();

var snaggers = [];
var votes = {};
config.set("reservedUser");

bot.on("add_dj", function(data) {
	var currentDJs = config.get("currentDJs");
	currentDJs.push(data.user[0].userid);
	config.set("currentDJs", currentDJs);
	console.log(new Date().toLocaleString() + " " + config.get(handy.implode(":", ["users", data.user[0].userid, "tt", "name"])) + " started DJing.");
	var reservedUser = config.get("reservedUser");

	if (reservedUser) {
		if (data.user[0].userid == reservedUser) {
			timer.stop();
		} else {
			bot.remDj(data.user[0].userid);
			return;
		}
	}

	var djAnnounce = config.get("bot:djAnnounce");

	if ((typeof djAnnounce != "undefined") && (data.user[0].userid != bot.userId) && !handy.inArray(data.user[0].userid, handy.merge(config.get("currentModerators"), config.get("gods")))) {
		bot.pm(djAnnounce, data.user[0].userid);
		console.log("(PM to " + config.get(handy.implode(":", ["users", data.user[0].userid, "tt", "name"])) + ") " + new Date().toLocaleString() + " " + config.get(handy.implode(":", ["users", bot.userId, "tt", "name"])) + ": " + djAnnounce);
	}
});

bot.on("booted_user", function(data) {
	console.log(new Date().toLocaleString() + " " + config.get(handy.implode(":", ["users", data.userid, "tt", "name"])) + " was booted from the room by " + config.get(handy.implode(":", ["users", data.modid, "tt", "name"])) + ". Reason: " + data.reason);
});

bot.on("deregistered", function(data) {
	config.set("currentUsers", handy.remove(data.user[0].userid, config.get("currentUsers")));
	config.set(handy.implode(":", ["users", data.user[0].userid, "lastSeen"]), new Date().toLocaleString());
	console.log(new Date().toLocaleString() + " " + config.get(handy.implode(":", ["users", data.user[0].userid, "tt", "name"])) + " left the room.");
});

bot.on("endsong", function(data) {
	var song = {
		artist: data.room.metadata.songlog[data.room.metadata.songlog.length - 1].metadata.artist,
		title: data.room.metadata.songlog[data.room.metadata.songlog.length - 1].metadata.song,
		userid: data.room.metadata.songlog[data.room.metadata.songlog.length - 1].djid,
		date: new Date().toLocaleString(),
		crowd: data.room.metadata.listeners,
		ups: votes.upvotes ? votes.upvotes : 0,
		downs: votes.downvotes ? votes.downvotes : 0,
		snags: snaggers.length,
		snaggers: snaggers
	}

	var stats = config.get(handy.implode(":", ["users", song.userid, "stats"]));

	if (typeof stats == "undefined") {
		stats = {
			plays: 0,
			ups: 0,
			downs: 0,
			snags: 0
		};
	}

	stats.plays++;
	stats.ups += song.ups;
	stats.downs += song.downs;
	stats.snags += song.snags;
	config.set(handy.implode(":", ["users", song.userid, "stats"]), stats);
	var info = [];
	info.push(":thumbsup: " + song.ups);
	info.push(":thumbsdown: " + song.downs);
	info.push("<3 " + song.snags);
	snaggers = [];
	votes = {};
	bot.speak(song.title + " " + handy.implode(", ", info));
});

bot.on("newsong", function(data) {
	var currentSong = data.room.metadata.current_song;
	var username = config.get(handy.implode(":", ["users", data.room.metadata.current_dj, "tt", "name"]));
	config.set("currentSong", currentSong);
	console.log(new Date().toLocaleString() + " " + username + " started playing \"" + currentSong.metadata.song + "\" by " + currentSong.metadata.artist + ".");

	if (config.get("bot:enableMusicBans")) {
		if (handy.inArray(currentSong.metadata.artist, config.get("banned:artists"))) {
			bot.remDj(data.room.metadata.current_dj);
			bot.speak("@" + username + ": The artist " + currentSong.metadata.artist + " is banned! Please check the /bannedartists.");
		} else if (handy.inArray(currentSong.metadata.song, config.get("banned:songs"))) {
			bot.remDj(data.room.metadata.current_dj);
			bot.speak("@" + username + ": The song \"" + currentSong.metadata.song + "\" is banned! Please check the /bannedsongs.");
		}
	}
});

bot.on("new_moderator", function(data) {
	var currentModerators = config.get("currentModerators");
	currentModerators.push(data.userid);
	config.set("currentModerators", currentModerators);
	console.log(new Date().toLocaleString() + " " + config.get(handy.implode(":", ["users", data.userid, "tt", "name"])) + " is now a moderator.");
});

bot.on("pmmed", function(data) {
	// Log all PMs
	console.log("(PM to " + config.get(handy.implode(":", ["users", bot.userId, "tt", "name"])) + ") " + new Date().toLocaleString() + " " + config.get(handy.implode(":", ["users", data.senderid, "tt", "name"])) + ": " + data.text);

	if (data.senderid != bot.userId) { // Bot shouldn't respond to itself
		var matches;

		if ((matches = /^\/(\w+)(?:\s+(.*))?$/.exec(data.text))) {
			// This is a command (/something), so execute the command
			if (commands.authorized(data.senderid, matches[1].toLowerCase())) {
				commands.execute(data.senderid, matches[1].toLowerCase(), matches[2], true);
			}
		} else {
			var modsAndGods = handy.merge(config.get("currentModerators"), config.get("gods"));
			var bannedUsers = config.get("banned:users");

			if (handy.inArray(data.senderid, modsAndGods) && !handy.inArray(data.senderid, bannedUsers)) {
				var username = config.get(handy.implode(":", ["users", data.senderid, "tt", "name"]));

				// This is a "mod chat", so PM it to all other mods/gods
				for (var i in modsAndGods) {
					if ((modsAndGods[i] != data.senderid) && (modsAndGods[i] != bot.userId) && !handy.inArray(modsAndGods[i], bannedUsers)) {
						bot.pm(username + ": " + data.text, modsAndGods[i]);
					}
				}
			}
		}
	}
});

bot.on("registered", function(data) {
	var currentUsers = config.get("currentUsers");
	currentUsers.push(data.user[0].userid);
	config.set("currentUsers", currentUsers);
	config.set(handy.implode(":", ["users", data.user[0].userid, "tt"]), data.user[0]);
	config.set(handy.implode(":", ["users", data.user[0].userid, "lastSeen"]), new Date().toLocaleString());
	console.log(new Date().toLocaleString() + " " + config.get(handy.implode(":", ["users", data.user[0].userid, "tt", "name"])) + " joined the room.");

	if (handy.inArray(data.user[0].userid, config.get("banned:users"))) {
		if (handy.inArray(data.user[0].userid, config.get("currentModerators"))) {
			bot.remModerator(data.user[0].userid);
		}

		bot.boot(data.user[0].userid, "You are banned from this room.");
		console.log(new Date().toLocaleString() + " " + config.get(handy.implode(":", ["users", data.user[0].userid, "tt", "name"])) + " was booted from the room (banned user).");
	} else if (data.user[0].userid != bot.userId) {
		var roomAnnounce = config.get("bot:roomAnnounce");

		if (typeof roomAnnounce != "undefined") {
			bot.pm(roomAnnounce, data.user[0].userid);
			console.log("(PM to " + config.get(handy.implode(":", ["users", data.user[0].userid, "tt", "name"])) + ") " + new Date().toLocaleString() + " " + config.get(handy.implode(":", ["users", bot.userId, "tt", "name"])) + ": " + roomAnnounce);
		}
	}
});

bot.on("rem_dj", function(data) {
	config.set("currentDJs", handy.remove(data.user[0].userid, config.get("currentDJs")));
	console.log(new Date().toLocaleString() + " " + config.get(handy.implode(":", ["users", data.user[0].userid, "tt", "name"])) + " stopped DJing.");
});

bot.on("rem_moderator", function(data) {
	config.set("currentModerators", handy.remove(data.userid, config.get("currentModerators")));
	console.log(new Date().toLocaleString() + " " + config.get(handy.implode(":", ["users", data.userid, "tt", "name"])) + " is no longer a moderator.");
});

bot.on("roomChanged", function(data) {
	var currentUsers = [];
	var currentModerators = [];

  	for (var i in data.users) {
		currentUsers.push(data.users[i].userid);
		config.set(handy.implode(":", ["users", data.users[i].userid, "tt"]), data.users[i]);
		config.set(handy.implode(":", ["users", data.users[i].userid, "lastSeen"]), new Date().toLocaleString());
		console.log(new Date().toLocaleString() + " " + config.get(handy.implode(":", ["users", data.users[i].userid, "tt", "name"])) + " is in the room.");

		if (handy.inArray(data.users[i].userid, config.get("banned:users"))) {
			bot.boot(data.users[i].userid, "You are banned from this room.");
			console.log(new Date().toLocaleString() + " " + config.get(handy.implode(":", ["users", data.users[i].userid, "tt", "name"])) + " was booted from the room (banned user).");
		}
	}

	config.set("currentUsers", currentUsers);
	config.set("currentDJs", data.room.metadata.djs);
	config.set("currentModerators", data.room.metadata.moderator_id);
});

bot.on("snagged", function(data) {
	snaggers.push(config.get(handy.implode(":", ["users", data.userid, "tt", "name"])));
});

bot.on("speak", function(data) {
	// Log all chats
	console.log(new Date().toLocaleString() + " " + data.name + ": " + data.text);

	if (data.userid != bot.userId) { // Bot shouldn't respond to itself
		config.set(handy.implode(":", ["users", data.userid, "lastSpoke"]), new Date().toLocaleString());
		var matches;

		// If this is a command (/something), execute the command
		if ((matches = /^\/(\w+)(?:\s+(.*))?$/.exec(data.text))) {
			if (commands.authorized(data.userid, matches[1].toLowerCase())) {
				commands.execute(data.userid, matches[1].toLowerCase(), matches[2]);
			}
		}
	}
});

bot.on("update_votes", function(data) {
	votes = data.room.metadata;
});
