//external libraries
var steamApi = require('steam-api');
var loadingSpinner = require('loading-spinner');
var dns = require('dns');


/***
 * Check network connectivity via a DNS lookup on the steam API website
 ***/
var _checkNetwork = function(callback) {
    dns.lookup('api.steampowered.com', function(err) {
        if (err && err.code == "ENOTFOUND") {
            callback(false);
        } else {
            callback(true);
        }
    })
};

/***
 * retrieve a list of games from steam
 * @params {object} oCmdlineParams, command line as per 'command-line-args'
 * @param {function} callback
 ***/
var _getGamesList = function(oCmdlineParams, callback) {
    var steamid = oCmdlineParams.steamid;
    var steamAPIkey = oCmdlineParams.steamAPIkey;

    var oSteam = this;
    var aGamesList = [];

    process.stdout.write("Fetching steam games list...")
    loadingSpinner.start(100, {
        clearChar: true
    });

    /***
     * checks network connectivity, exits on failure
     ***/
    _checkNetwork(function(isConnected) {
        if (isConnected) {
            var player = new steamApi.Player(steamAPIkey, steamid);

            player.GetOwnedGames(
                steamid,
                optionalIncludeAppInfo = true,
                optionalIncludePlayedFreeGames = false,
                optionalAppIdsFilter = [])
                .done(function(result) {
                parseSteamResult(result);
            });
        } else {
            loadingSpinner.stop();
            process.stdout.write("\nNo network connectivity. Either your system is not connected to the internet or the site at api.steampowered.com is unreachable.\nExiting.");
            process.exit(0);
        }
    });


    /***
     * parse results of steam query
     * @param {array} result
     **/
    var parseSteamResult = function(result) {

        if (!Array.isArray(result) || result.length === 0) {
            process.stdout.write("\n" + "No games found. Exiting.");
            process.exit(0);
        }

        for (i = 0; i < result.length; i++) {
            aGamesList.push(result[i].name);
        }

        loadingSpinner.stop();
        process.stdout.write("\n" + aGamesList.length + " games fetched.");

        callback(aGamesList);
    }



};

module.exports = {
    getGamesList: _getGamesList,
    checkNetwork:_checkNetwork
};