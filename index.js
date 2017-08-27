//external libraries
var commandLineArgs = require('command-line-args');
var getUsage = require('command-line-usage');

//internal libraries
var steam = require('./steam.js');
var wallpaper = require('./download.js');


//constants
//define command line options 
const optionDefinitions = [{
        name: 'childsafe',
        alias: 'c',
        type: Boolean
    }, {
        name: 'steamAPIkey',
        alias: 'k',
        type: String,
        defaultOption: true
    }, {
        name: 'steamid',
        alias: 'i',
        type: String
    }, {
        name: 'help',
        alias: '?',
        type: Boolean
    }, {
        name: 'limit',
        alias: 'l',
        type: String
    }, {
        name: 'overwrite',
        alias: 'o',
        type: Boolean
    }, {
        name: 'outputdir',
        alias: 'd',
        type: String
    }, {
        name: 'width',
        alias: 'x',
        type: String
    }, {
        name: 'height',
        alias: 'y',
        type: String
    },
];

var main = function() {

    this.init = function() {
debugger;
        //get user options, exits on invalid inout
        var oCmdlineParams = processCommandLineInput(commandLineArgs(optionDefinitions, {
            partial: true
        }));

        var callbackHandler = function(oCmdlineParams) {
            return function(aGamesList) {
                wallpaper.download(aGamesList, oCmdlineParams); //download games from gamesdb.net
            }
        };

        //retrieve array of games via steamAPI, exits on 0 games found
        steam.getGamesList(oCmdlineParams, callbackHandler(oCmdlineParams));
    };

    /***
     * handle user command line input
     * @params {object} oParams.  command line as per 'command-line-args'
     * @returns {object}, command line args are returned if they validate.
     ***/
    this.processCommandLineInput = function(oParams) {

        bFail = false;

        if (typeof oParams._unknown !== "undefined" && oParams._unknown.length !== 0) {
            console.log('\x1b[33m%s\x1b[0m', "Invalid Option(s): " + oParams._unknown.join(", ")); 
        }

        if (oParams.help === true) {
            outputHelp();
            process.exit(0);
        }

        //<--compulsory switches
        if (typeof oParams.steamid === "undefined" || oParams.steamid === null || oParams.steamid === "") {
            console.log('\x1b[33m%s\x1b[0m', "Please supply a valid steamID using the -steamid option.");
            bFail = true;
        }

        if (typeof oParams.steamAPIkey === "undefined" || oParams.steamAPIkey === null || oParams.steamid === "") {
            console.log('\x1b[33m%s\x1b[0m', "Please supply a valid steamAPIkey using the -steamAPIkey option.");
            bFail = true;
        }
        //compulsory switches-->

        if (bFail) {
            outputHelp();
            process.exit(0);
        }

        return oParams;
    };

    /**
     * output program help to console
     ***/
    this.outputHelp = function() {

        //where the option help is set to true, call a function:
        //define usage guide
        var sections = [{
                header: 'Steam Wallpaper Downloader',
                content: 'Downloads wallpapers for games owned by a nominated steam account.'
            }, {
                header: 'Options',
                optionList: [{
                        name: 'steamid, [bold]{-i}',
                        typeLabel: '[underline]{steamID}',
                        description: 'Target Steam Account id. See https://steamcommunity.com/sharedfiles/filedetails/?id=209000244 for further information on determining your steam id.'
                    }, {
                        name: 'steamAPIkey, [bold]{-k}',
                        typeLabel: '[underline]{steamAPIkey}',
                        description: 'SteamAPIKey. http://steamcommunity.com/dev/apikey'
                    }, {
                        name: 'limit, [bold]{-l}',
                        typeLabel: '[underline]{limit}',
                        description: 'Image download limit. Specify the number of images that will be downloaded per game. Default limit is 3.'
                    }, {
                        name: 'outputdir, [bold]{-d}',
                        typeLabel: '[underline]{path}',
                        description: 'Specify an output directory (relative path) for downloaded images. If the specified directory does not exist it will be created. When this option is omitted ./images is written to.'
                    }, {
                        name: 'width, [bold]{-x}',
                        typeLabel: '[underline]{1920}',
                        description: 'Match only images with this width dimension, in pixels.'
                    }, {
                        name: 'height, [bold]{-y}',
                        typeLabel: '[underline]{1080}',
                        description: 'Match only images with this height dimension, in pixels.'
                    }, {
                        name: 'childsafe, [bold]{-c}',
                        description: "Retrieves only those games with an ESRB rating of 'E - Everyone'. Unrated games are skipped."
                    }, {
                        name: 'overwrite, [bold]{-o}',
                        description: "Will re-download a wallpaper if the file already exists locally. Default is to skip an existing file."
                    }, {
                        name: 'help, [bold]{-?}',
                        description: 'Print this usage guide.'
                    }
                ]
            }
        ]
        var usage = getUsage(sections)
        console.log(usage);
    };
    debugger;
    init();
}();