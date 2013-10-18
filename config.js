module.exports = function(file) {
	this.nconf = require("nconf");
	this.nconf.use("file", {file: file});

	this.get = function(key) {
		return this.nconf.get(key);
	};

	this.set = function(key, value) {
		this.nconf.set(key, value);
		this.nconf.save();
	}

	return this;
};
