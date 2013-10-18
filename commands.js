module.exports = function(config, bot, timer) {
	this.bot = bot;
	this.config = config;
	this.timer = timer;
	this.handy = require("./handy.js")();

// Check to see if a user is authorized to perform the current command
//
// @param string userid The user's id
// @param string command The command
// @return boolean True if authorized, False otherwise
	this.authorized = function(userid, command) {
		var user = this.config.get(this.handy.implode(":", ["users", userid]));

		if (this.handy.inArray(userid, this.config.get("banned:users"))) {
			return false;
		}

		if (this.handy.inArray(userid, this.config.get("gods"))) {
			return true;
		}

		if (this.handy.inArray(command, this.config.get("commands:all"))) {
			return true;
		}

		if (this.handy.inArray(userid, this.config.get("currentModerators"))) {
			return this.handy.inArray(command, this.config.get(this.handy.implode(":", ["commands", "moderator"])));
		}

		return false;
	};

// Execute a command
//
// @param string userid The user's id
// @param string command The command
// @param string parameter The parameter (optional)
// @param boolean pm True if the bot should respond via PM instead of public chat (optional, defaults to False)
	this.execute = function(userid, command, parameter, pm) {
		if (typeof this.commands[command] == "function") {
			var command = this.commands[command];
			this.parameter = parameter;

			if ((typeof pm != "undefined") && pm) {
				this.speak = function(text) {
					bot.pm(text, this.user.tt.userid);
					console.log("(PM to " + this.config.get(this.handy.implode(":", ["users", userid, "tt", "name"])) + ") " + new Date().toLocaleString() + " " + this.config.get(this.handy.implode(":", ["users", bot.userId, "tt", "name"])) + ": " + text);
				};
			} else {
				this.speak = function(text) {
					bot.speak("@" + this.user.tt.name + ": " + text);
				};
			}

			this.user = this.config.get(this.handy.implode(":", ["users", userid]));
			command();
		}
	};

// Get User
//
// @param string username The user's name
// @return object The user (if found)
	this.getUser = function(username) {
		// Remove optional "@" from beginning of username
		if (username.substr(0, 1) == "@") {
			username = username.substr(1);
		}

		var users = this.config.get("users");

		for (var userid in users) {
			var user = users[userid];

			if ((typeof user.tt != "undefined") && (typeof user.tt.name != "undefined") && (user.tt.name.toLowerCase() == username.toLowerCase())) {
				return user;
			}
		}
	};

	this.commands = {
		parent: this,

		banartist: function() {
			var artist;

			if (typeof this.parameter == "undefined") {
				artist = this.config.get("currentSong:metadata:artist");

				if (typeof artist == "undefined") {
					this.speak("No song is currently playing, so I can't ban the artist.");
					return;
				}
			} else {
				artist = this.parameter;
			}

			var bannedArtists = this.config.get("banned:artists");

			if (typeof bannedArtists == "undefined") {
				bannedArtists = [];
			}

			if (this.handy.inArray(artist, bannedArtists)) {
				this.speak("The artist \"" + artist + "\" is already banned.");
			} else {
				bannedArtists.push(artist);
				this.config.set("banned:artists", bannedArtists);
				this.speak("The artist \"" + artist + "\" has been banned.");
			}
		},

		bannedartists: function() {
			var bannedArtists = this.config.get("banned:artists");

			if (!this.config.get("bot:enableMusicBans")) {
				this.speak("Music bans are currently disabled.");
			} else if ((typeof bannedArtists != "undefined") && bannedArtists.length) {
				bannedArtists.sort();
				this.speak("Banned artists: " + this.handy.implode(", ", bannedArtists));
			} else {
				this.speak("No artists are currently banned.");
			}
		},

		bannedsongs: function() {
			var bannedSongs = this.config.get("banned:songs");

			if (!this.config.get("bot:enableMusicBans")) {
				this.speak("Music bans are currently disabled.");
			} else if ((typeof bannedSongs != "undefined") && bannedSongs.length) {
				bannedSongs.sort();
				this.speak("Banned songs: \"" + this.handy.implode("\", \"", bannedSongs) + "\"");
			} else {
				this.speak("No songs are currently banned.");
			}
		},

		bannedusers: function() {
			var bannedUsers = this.config.get("banned:users");

			if (typeof bannedUsers == "undefined") {
				bannedUsers = [];
			}

			var bannedUsernames = [];

			for (var i in bannedUsers) {
				var bannedUsername = this.config.get(this.handy.implode(":", ["users", bannedUsers[i], "tt", "name"]));

				if (bannedUsername) {
					bannedUsernames.push(bannedUsername);
				} else {
					bannedUsernames.push("Unknown User (" + bannedUsers[i] + ")");
				}
			}

			if (bannedUsernames.length) {
				bannedUsernames.sort();
				this.speak("Banned users: " + this.handy.implode(", ", bannedUsernames));
			} else {
				this.speak("No users are currently banned.");
			}
		},

		bansong: function() {
			var song;

			if (typeof this.parameter == "undefined") {
				song = this.config.get("currentSong:metadata:song");

				if (typeof song == "undefined") {
					this.speak("No song is currently playing, so I can't ban it.");
					return;
				}
			} else {
				song = this.parameter;
			}

			var bannedSongs = this.config.get("banned:songs");

			if (typeof bannedSongs == "undefined") {
				bannedSongs = [];
			}

			if (this.handy.inArray(song, bannedSongs)) {
				this.speak("The song \"" + song + "\" is already banned.");
			} else {
				bannedSongs.push(song);
				this.config.set("banned:songs", bannedSongs);
				this.speak("The song \"" + song + "\" has been banned.");
			}
		},

		banuser: function() {
			if (typeof this.parameter == "undefined") {
				this.speak("You need to specify a user to ban, e.g.: /banuser Dj Diddy B's");
				return;
			}

			var targetUser = this.getUser(this.parameter);
			var bannedUsers = this.config.get("banned:users");

			if (typeof bannedUsers == "undefined") {
				bannedUsers = [];
			}

			if (typeof targetUser == "undefined") {
				this.speak("Sorry, I have no idea who " + this.parameter + " is.");
			} else if (this.handy.inArray(targetUser.tt.userid, bannedUsers)) {
				this.speak("The user " + targetUser.tt.name + " is already banned.");
			} else {
				bot.remModerator(targetUser.tt.userid);
				bannedUsers.push(targetUser.tt.userid);
				this.config.set("banned:users", bannedUsers);

				if (this.handy.inArray(targetUser.tt.userid, this.config.get("currentUsers"))) {
					bot.boot(targetUser.tt.userid, "You are banned from this room.");
				}

				this.speak("The user " + targetUser.tt.name + " has been banned.");
			}
		},

		banuserid: function() {
			if (typeof this.parameter == "undefined") {
				this.speak("You need to specify a user ID to ban, e.g.: /banuserid 4e29d875a3f751514705cdf1");
				return;
			}

			var userid = this.parameter.toLowerCase();
			var regex = /^[0-9a-f]{24}$/;

			if (!regex.test(userid)) {
				this.speak("\"" + userid + "\" is not a valid user ID. Please check it and try again.");
				return;
			}

			var bannedUsers = this.config.get("banned:users");

			if (typeof bannedUsers == "undefined") {
				bannedUsers = [];
			}

			if (this.handy.inArray(userid, bannedUsers)) {
				this.speak("The user ID " + userid + " is already banned.");
			} else {
				bannedUsers.push(userid);
				this.config.set("banned:users", bannedUsers);

				if (this.handy.inArray(userid, this.config.get("currentUsers"))) {
					bot.boot(userid, "You are banned from this room.");
				}

				this.speak("The user ID " + userid + " has been banned.");
			}
		},

		catfacts: function() {
			var catfacts = this.config.get("catfacts");
			var random = Math.floor(Math.random() * catfacts.length);
			this.speak(catfacts[random]);
		},

		changeroom: function() {
			if (typeof this.parameter == "undefined") {
				this.speak("You need to specify a room ID to join, e.g.: /changeroom 4fcf96404fb0bb0cc70c9285");
				return;
			}

			var roomid = this.parameter.toLowerCase();
			var regex = /^[0-9a-f]{24}$/;

			if (!regex.test(roomid)) {
				this.speak("\"" + roomid + "\" is not a valid room ID. Please check it and try again.");
				return;
			}

			bot.roomRegister(roomid);
		},

		commands: function() {
			this.speak("Commands: /" + this.handy.implode(" /", this.config.get("commands:all")));

			if (this.handy.inArray(this.user.tt.userid, this.handy.merge(this.config.get("currentModerators"), this.config.get("gods")))) {
				bot.pm("Moderator Commands: /" + this.handy.implode(" /", this.config.get("commands:moderator")), this.user.tt.userid);
			}

			if (this.handy.inArray(this.user.tt.userid, this.config.get("gods"))) {
				bot.pm("God Commands: /" + this.handy.implode(" /", this.config.get("commands:god")), this.user.tt.userid);
			}
		},

		dance: function() {
			var dances = this.config.get("dances");
			var random = Math.floor(Math.random() * dances.length);
			this.speak(dances[random]);
		},

		disablemusicbans: function() {
			if (this.config.get("bot:enableMusicBans")) {
				this.config.set("bot:enableMusicBans", false);
				this.speak("Music bans are now disabled.");
			} else {
				this.speak("Music bans are already disabled.");
			}
		},

		dj: function() {
			bot.addDj();
		},

		djannounce: function() {
			var djAnnounce = this.config.get("bot:djAnnounce");

			if (typeof djAnnounce == "undefined") {
				this.speak("No DJ announcement has been set.");
			} else {
				this.speak(djAnnounce);
			}
		},

		enablemusicbans: function() {
			if (this.config.get("bot:enableMusicBans")) {
				this.speak("Music bans are already enabled.");
			} else {
				this.config.set("bot:enableMusicBans", true);
				this.speak("Music bans are now enabled.");
			}
		},

		erm: function() {
			if (typeof this.parameter == "undefined") {
				this.speak("U FERGERT TER TERP A SERNTERNC");
				return;
			}

			var ermagherd = require("./ermahgerd.js")();
			var werdsErer = this.parameter.toUpperCase().split(" ");

			for (var i in werdsErer) {
				werdsErer[i] = ermagherd.translate(werdsErer[i]);
			}

			this.speak(this.handy.implode(" ", werdsErer));
		},

		escort: function() {
			if (typeof this.parameter == "undefined") {
				this.speak("You need to specify a username, e.g. /escort b0rt");
				return;
			}

			var targetUser = this.getUser(this.parameter);

			if (typeof targetUser == "undefined") {
				this.speak("Sorry, I have no idea who " + this.parameter + " is.");
				return;
			}

			bot.remDj(targetUser.tt.userid);
		},

		fortune: function() {
			var exec = require("child_process").exec;

			exec(this.config.get("bot:fortuneCommand"), function(error, stdout, stderr) {
				this.speak(stdout.replace(/\s+/g, " "));
			});
		},

		god: function() {
			if (typeof this.parameter == "undefined") {
				this.speak("You need to specify a username, e.g. /god Mad Joker");
				return;
			}

			var targetUser = this.getUser(this.parameter);	

			if (typeof targetUser == "undefined") {
				this.speak("Sorry, I have no idea who " + this.parameter + " is.");
				return;
			}

			if (targetUser.tt.userid == bot.userId) {
				this.speak("Please don't make me a god. I can't be trusted with that kind of power.");
				return;
			}

			var gods = this.config.get("gods");

			if (this.handy.inArray(targetUser.tt.userid, gods)) {
				this.speak(targetUser.tt.name + " is already a god.");
			} else {
				gods.push(targetUser.tt.userid);
				this.config.set("gods", gods);
				this.speak(targetUser.tt.name + " is now a god.");
			}
		},

		gods: function() {
			var gods = this.config.get("gods");

			if ((typeof gods != "undefined") && gods.length) {
				var godNames = [];

				for (var i in gods) {
					godNames.push(this.config.get(this.handy.implode(":", ["users", gods[i], "tt", "name"])));
				}

				godNames.sort();
				this.speak("Current gods: " + this.handy.implode(", ", godNames));
			} else {
				this.speak("There are currently no gods.");
			}
		},

		mystats: function() {
			if (typeof user.stats == "undefined") {
				this.speak("I've never seen you play a song in this room. Therefore, you currently have no stats.");
			} else {
				this.speak("Plays: " + this.user.stats.plays + ", Ups: " + this.user.stats.ups + ", Downs: " + this.user.stats.downs + ", Snags: " + this.user.stats.snags + ", Avg. Points: " + (this.user.stats.ups / this.user.stats.plays).toFixed(2) + " (since " + this.config.get("bot:startDate") + ")");
			}
		},

		pandafacts: function() {
			var pandafacts = this.config.get("pandafacts");
			var random = Math.floor(Math.random() * pandafacts.length);
			this.speak(pandafacts[random]);
		},

		refresh: function() {
			var reservedUser = this.config.get("reservedUser");

			if (this.handy.inArray(user.tt.userid, this.config.get("currentDJs"))) {
				if (reservedUser) {
					if (reservedUser == user.tt.userid) {
						this.speak("Your seat is already reserved! Just refresh already.");
					} else {
						this.speak("Sorry, " + this.config.get(this.handy.implode(":", ["users", reservedUser, "tt", "name"])) + " is currently refreshing! Please wait a moment and try again.");
					}
				} else {
					this.bot.speak(user.tt.name + " has requested a refresh. I will hold the seat for " + this.config.get("bot:refreshWaitMaxSeconds")  + " seconds starting now. If anyone other than " + user.tt.name + " steals the spot, they will get escorted.");
					this.config.set("reservedUser", user.tt.userid);
					this.timer.start();
				}
			} else {
				this.speak("You can't use the refresh feature because you aren't a DJ!");
			}
		},

		roomannounce: function() {
			var roomAnnounce = this.config.get("bot:roomAnnounce");

			if (typeof roomAnnounce == "undefined") {
				this.speak("No room announcement has been set.");
			} else {
				this.speak(roomAnnounce);
			}
		},

		say: function() {
			if (typeof this.parameter == "undefined") {
				this.speak("You need to tell me what to say, e.g.: /say This song is awesome.");
			} else {
				bot.speak(this.parameter);
			}
		},

		seen: function() {
			if (typeof this.parameter == "undefined") {
				this.speak("You need to specify a user to look for, e.g.: /seen Mad Joker");
				return;
			}

			var targetUser = this.getUser(this.parameter);

			if (typeof targetUser == "undefined") {
				this.speak("Sorry, I have no idea who " + this.parameter + " is.");
			} else if (targetUser.tt.userid == bot.userId) {
				this.speak("I'm right here, smartass.");
			} else if (targetUser.tt.userid == user.tt.userid) {
				this.speak("Try a mirror, stupid.");
			} else if (this.handy.inArray(targetUser.tt.userid, this.config.get("currentUsers"))) {
				this.speak(targetUser.tt.name + " is currently in the room! What are you, blind?");
			} else {
				this.speak("I last saw " + targetUser.tt.name + " on " + targetUser.lastSeen + ".");
			}
		},

		setdjannounce: function() {
			if (typeof this.parameter == "undefined") {
				this.config.set("bot:djAnnounce");
				this.speak("The DJ announcement has been cleared.");
			} else {
				this.config.set("bot:djAnnounce", this.parameter);
				this.speak("The DJ announcement has been set to: " + this.parameter);
			}
		},

		setroomannounce: function() {
			if (typeof this.parameter == "undefined") {
				this.config.set("bot:roomAnnounce");
				this.speak("The room announcement has been cleared.");
			} else {
				this.config.set("bot:roomAnnounce", this.parameter);
				this.speak("The room announcement has been set to: " + this.parameter);
			}
		},

		snag: function() {
			bot.playlistAdd(this.config.get("currentSong:_id"));
			bot.snag();
		},

		unbanartist: function() {
			if (typeof this.parameter == "undefined") {
				this.speak("You need to specify an artist to unban, e.g.: /unbanartist Rebecca Black");
				return;
			}

			var bannedArtists = this.config.get("banned:artists");

			if (this.handy.inArray(this.parameter, bannedArtists)) {
				this.config.set("banned:artists", this.handy.remove(this.parameter, bannedArtists));
				this.speak("The artist " + this.parameter + " has been unbanned.");
			} else {
				this.speak("The artist " + this.parameter + " is not banned.");
			}
		},

		unbansong: function() {
			if (typeof this.parameter == "undefined") {
				this.speak("You need to specify a song to unban, e.g.: /unbansong Call Me Maybe");
				return;
			}

			var bannedSongs = this.config.get("banned:songs");

			if (this.handy.inArray(this.parameter, bannedSongs)) {
				this.config.set("banned:songs", this.handy.remove(this.parameter, bannedSongs));
				this.speak("The song \"" + this.parameter + "\" has been unbanned.");
			} else {
				this.speak("The song \"" + this.parameter + "\" is not banned.");
			}
		},

		unbanuser: function() {
			if (typeof this.parameter == "undefined") {
				this.speak("You need to specify a user to unban, e.g. /unbanuser urban_uprising");
				return;
			}

			var targetUser = this.getUser(this.parameter);
			var bannedUsers = this.config.get("banned:users");

			if (typeof bannedUsers == "undefined") {
				bannedUsers = [];
			}

			if (typeof targetUser == "undefined") {
				this.speak("Sorry, I have no idea who " + this.parameter + " is.");
			} else if (this.handy.inArray(targetUser.tt.userid, bannedUsers)) {
				bannedUsers = this.handy.remove(targetUser.tt.userid, bannedUsers);
				this.config.set("banned:users", bannedUsers);
				this.speak("The user " + targetUser.tt.name + " has been unbanned.");
			} else {
				this.speak("The user " + targetUser.tt.name + " is not banned.");
			}
		},

		unbanuserid: function() {
			if (typeof this.parameter == "undefined") {
				this.speak("You need to specify a user ID to unban, e.g.: /unbanuserid 50b23699aaa5cd7e2fdb29f9");
				return;
			}

			var userid = this.parameter.toLowerCase();
			var regex = /^[0-9a-f]{24}$/;

			if (!regex.test(userid)) {
				this.speak("\"" + userid + "\" is not a valid user ID. Please check it and try again.");
				return;
			}

			var bannedUsers = this.config.get("banned:users");

			if (typeof bannedUsers == "undefined") {
				bannedUsers = [];
			}

			if (!this.handy.inArray(userid, bannedUsers)) {
				this.speak("The user ID " + userid + " is not banned.");
			} else {
				bannedUsers = this.handy.remove(userid, bannedUsers);
				this.config.set("banned:users", bannedUsers);
				this.speak("The user ID " + userid + " has been unbanned.");
			}
		},

		ungod: function() {
			if (typeof this.parameter == "undefined") {
				this.speak("You need to specify a username, e.g. /ungod b0rt");
				return;
			}

			var targetUser = this.getUser(this.parameter);

			if (typeof targetUser == "undefined") {
				this.speak("Sorry, I have no idea who " + this.parameter + " is.");
				return;
			}

			if (targetUser.tt.userid == this.user.tt.userid) {
				this.speak("You can't ungod yourself.");
				return;
			}

			var gods = this.config.get("gods");

			if (this.handy.inArray(targetUser.tt.userid, gods)) {
				this.config.set("gods", this.handy.remove(targetUser.tt.userid, gods));
				this.speak(targetUser.tt.name + " is no longer a god.");
			} else {
				this.speak(targetUser.tt.name + " is not a god.");
			}
		},

		unmoduser: function() {
			if (typeof this.parameter == "undefined") {
				this.speak("You need to specify a username, e.g. /unmoduser b0rt");
				return;
			}
	
			var targetUser = this.getUser(this.parameter);

			if (typeof targetUser == "undefined") {
				this.speak("Sorry, I have no idea who " + this.parameter + " is.");
				return;
			}

			if (targetUser.tt.userid == this.user.tt.userid) {
				this.speak("You can't unmod yourself.");
				return;
			}

			bot.remModerator(targetUser.tt.userid);
			this.speak(targetUser.tt.name + " has been unmodded.");
		},

		unmoduserid: function() {
			if (typeof this.parameter == "undefined") {
				this.speak("You need to specify a username, e.g. /unmoduserid 4e4b4ba1a3f751044b133f41");
				return;
			}

			var userid = this.parameter.toLowerCase();
			var regex = /^[0-9a-f]{24}$/;

			if (!regex.test(userid)) {
				this.speak("\"" + userid + "\" is not a valid user ID. Please check it and try again.");
				return;
			}

	
			if (userid == this.user.tt.userid) {
				this.speak("You can't unmod yourself.");
				return;
			}

			bot.remModerator(userid);
			this.speak(userid + " has been unmodded.");
		}
	};

	return this;
};
