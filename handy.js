module.exports = function() {

// Combine an array's elements into a string
//
// @param string separator The separator
// @param array array The array
// @return string The string
	this.implode = function(separator, array) {
		var string = "";

		for (var i in array) {
			string += array[i];

			if (i < array.length - 1) {
				string += separator;
			}
		}

		return string;
	};

// Find a needle (element) in a haystack (array)
//
// @param mixed needle The needle
// @param array haystack The haystack
// @param boolean caseSensitive True if a case sensitive match is required (optional, defaults to False)
// @return boolean True if the needle was found, False otherwise
	this.inArray = function(needle, haystack, caseSensitive) {
		if (typeof caseSensitive == "undefined") {
			caseSensitive = false;
		}

		for (var i in haystack) {
			if (haystack[i] == needle) {
				return true;
			}

			if (!caseSensitive && (haystack[i].toLowerCase() == needle.toLowerCase())) {
				return true;
			}
		}

		return false;
	};

// Merge two arrays (while removing duplicates)
//
// @param array1 The first array
// @param array2 The second array
// @return The merged array
	this.merge = function(array1, array2) {
		var newArray = [];

		for (var i in array1) {
			if (!this.inArray(array1[i], newArray)) {
				newArray.push(array1[i]);
			}
		}

		for (var i in array2) {
			if (!this.inArray(array2[i], newArray)) {
				newArray.push(array2[i]);
			}
		}

		return newArray;
	};

// Remove an element from an indexed array
//
// @param mixed needle The needle
// @param array array The array
// @param boolean caseSensitive True if a case sensitive match is required (optional, defaults to False)
// @return array The modified array
	this.remove = function(needle, array, caseSensitive) {
		var newArray = [];

		if (typeof caseSensitive == "undefined") {
			caseSensitive = false;
		}

		for (var i in array) {
			if (caseSensitive) {
				if (array[i] != needle) {
					newArray.push(array[i]);
				}
			} else {
				if (array[i].toLowerCase() != needle.toLowerCase()) {
					newArray.push(array[i]);
				}
			}
		}

		return newArray;
	};

	return this;
};
