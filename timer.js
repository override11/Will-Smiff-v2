module.exports = function(config, bot) {
	this.bot = bot;
	this.config = config;
	this.handy = require("./handy.js")();

	this.start = function() {
		this.refreshWait = setTimeout(this.waitForDJ, 1000 * this.config.get("bot:refreshWaitMaxSeconds"), this);
	};

	this.stop = function() {
		clearTimeout(this.refreshWait);
		this.config.set("reservedUser");
	};

	this.waitForDJ = function(timer) {
		timer.bot.speak("Sorry @" + timer.config.get(timer.handy.implode(":", ["users", timer.config.get("reservedUser"), "tt", "name"])) + ", you took too long! The spot is now available for anyone to grab.");
		timer.config.set("reservedUser");
	};

	return this;
};
