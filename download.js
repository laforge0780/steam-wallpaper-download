//external libraries
var loadingSpinner = require('loading-spinner');
var request = require('request');
var xml2js = require('xml2js');
var fs = require('fs');
var sanitizeFilename = require("sanitize-filename");
var util = require('util');


/***
 * download images from remote server
 * @param {object} oData, {sName {string} : game name, aImages {array} : image path strings}
 * @params {object} oCmdlineParams, command line as per 'command-line-args'
 * @param {functio} callback
 ***/
var _getFiles = function(oData, oCmdlineParams, callback) {
    var iQueue = 0;
    var sOutputDir = (typeof oCmdlineParams.outputdir === "undefined" ? "./images" : "./" + sanitizeFilename(oCmdlineParams.outputdir));

    /***
     * file download operations
     * @param {String} sURL, remote image URL
     * @param {String} sOutputFile, output file name
     * @param {function} callback (incrementQueue)
     ***/
    var download = function(oParams) {
        var file = fs.createWriteStream(sOutputDir + "/" + oParams.sOutputFile);

        var options = {
            url: oParams.sURL,
            timeout: 5000
        }
        var sendReq = request.get(options);

        // verify response code
        sendReq.on('response', function(response) {
            if (response.statusCode !== 200) {
                return oParams.callback('Response status was ' + response.statusCode);
            }
        });

        // check for request errors
        sendReq.on('error', function(err) {
            fs.unlink(sOutputDir + "/" + oParams.sOutputFile);
            return oParams.callback(err.message);
        });

        sendReq.pipe(file);

        file.on('finish', function() {
            file.close(oParams.callback); // close() is async, call cb after close completes.
        });

        file.on('error', function(err) { // Handle errors
            fs.unlink(sOutputDir + "/" + oParams.sOutputFile); // Delete the file async.
            return oParams.callback(err.message);
        });
    };

    /***
     * Checks for existence of file in the user-defined output directory
     * @param {String} sFilename,  filename 
     * @returns {boolean}
     ***/
    var exists = function(sFileName) {
        if (fs.existsSync(sOutputDir + "/" + sFileName)) {
            return true;
        } else {
            return false;
        }
    };

    /***
     * @param {object??} err, undefined if download process did not throw an error
     *
     ***/
    var incrementQueue = function(err) {
        loadingSpinner.stop();

        if (err !== null && typeof err !== "undefined") {
            switch (err) {
                case "ETIMEDOUT":
                case "ESOCKETTIMEDOUT":
                    process.stdout.write("Connection timed out, download aborted.");
                    break;
                default:
                    process.stdout.write("Error: " + err + ", download aborted.");
                    break;
            }
        } else {
            process.stdout.write("...done.");
        }

        iQueue++;

        if (iQueue >= oData.aImages.length) {
            callback(); //exit
        } else {
            processDownloadQueue(); //next
        }
    };

    /***
     * returns a sane filename so that files may be written to a single directory
     * For example: 80131.jpg becomes bioshock_infinite_80131.jpg
     * @param {String} sGameName, name of the target game
     * @param {String} sOriginalFilePath, source URL
     * @returns {String}
     ***/
    var getName = function(sGameName, sOriginalFilePath) {
        var sOriginalFileName = sOriginalFilePath.substring(sOriginalFilePath.lastIndexOf('/') + 1);
        var sFileName = sanitizeFilename(sGameName + "_" + sOriginalFileName);
        return sFileName;
    };

    var processDownloadQueue = function() {
        var outputFileName = getName(oData.sName, oData.aImages[iQueue]);

        if (oCmdlineParams.overwrite || !exists(outputFileName)) {
            loadingSpinner.start(100, {
                clearChar: true
            });
            process.stdout.write("\nDownloading file '" + sOutputDir + "/" + outputFileName + "' .....")
            download({
                sURL: oData.aImages[iQueue],
                sOutputFile: outputFileName,
                callback: incrementQueue
            });
        } else {
            process.stdout.write("\nFile '" + sOutputDir + "/" + outputFileName + "' exists, skipping.");
            incrementQueue();
        }
    };

    _createDirectory(sOutputDir, processDownloadQueue);
};

/***
 * creates the output directory. One time operation
 * @param {String} path, relative directory path
 * @param {Function} callback
 ***/
var _createDirectory = function(path, callback) {

    fs.mkdir(path, function(err) {
        if (err) {
            if (err.code == 'EEXIST') callback(null); // ignore the error if the folder already exists
            else callback(err); // something else went wrong
        } else callback(null); // successfully created folder
    });
};

/***
 * 
 ***/
var _download = function(aGamesList, oCmdlineParams) {

    var iGamesCounter = 0;
    var iImagesDownloaded = 0;

    var bChildSafeOnly = (typeof oCmdlineParams.childsafe !== "undefined") ? true : false;
    var iLimit = (typeof oCmdlineParams.limit !== "undefined") ? parseInt(oCmdlineParams.limit, 10) : 3;

    /***
     * process list of found images
     ***/
    var processList = function() {
        //console.log("item: "+i);
        if (iGamesCounter < aGamesList.length) {
            process.stdout.write("\n*****");
            loadingSpinner.start(100, {
                clearChar: true
            });
            console.log('\x1b[1m\x1b[33m%s\x1b[0m', "\n[" + (parseInt(iGamesCounter, 10) + 1) + "/" + aGamesList.length + "] Retrieving image data for '" + aGamesList[iGamesCounter] + "' .....");
            getGameData(aGamesList[iGamesCounter]);

        } else {
            process.stdout.write("\n*****");
            process.stdout.write("\nFinished. Retrieved " + iImagesDownloaded + " image(s).")
        }
    }

    /***
     * Retrieve data and images from thegamesdb.net for a specified game
     * @param {String} sGame, game name
     ***/
    var getGameData = function(sGame) {
        //NOTE: exactname does not return singular results, it just returns an array of whole string matches
        //rather than partial name matches. We're using the first returned item only.
        var sURL = 'http://thegamesdb.net/api/GetGame.php?exactname=' + sGame;
        var str = '';

        var options = {
            url: sURL,
            timeout: 5000
        }

        var sendReq = request.get(options);

        // verify response code
        sendReq.on('response', function(response) {
            if (response.statusCode !== 200) {
                process.stdout.write('Response status was ' + response.statusCode);
                process.exit(0);
            }
        });

        // check for request errors
        sendReq.on('error', function(err) {
            switch (err) {
                case "ETIMEDOUT":
                case "ESOCKETTIMEDOUT":
                    process.stdout.write("Connection timed out, unable to retrieve data from " + sURL);
                    break;
                default:
                    process.stdout.write("\nAn error occurred retrieving data from " + sURL + ":", err); // Print the error if one occurred
                    break;
            }
            loadingSpinner.stop();
            incrementQueue();
        });

        sendReq.on('data', function(chunk) {
            str += chunk;
        });

        sendReq.on('end', function() {
            loadingSpinner.stop();
            var aGameData = parseXML(str, sGame, sURL);

            if (aGameData && aGameData.aImages.length > 0) {
                _getFiles(aGameData, oCmdlineParams, incrementQueue);
            } else {
                incrementQueue();
            }
        });
    };

    var incrementQueue = function() {
        iGamesCounter++; //increment steam list
        processList(); //next
    }

    /***
     * checks game for childsafe rating
     * @params {String} sESRB, game rating
     * @returns {Boolean}
     ***/
    var isChildSafeRated = function(sESRB) {
        if (typeof sESRB === "undefined") {
            //no rating data
            return false;
        } else if (sESRB === 'E - Everyone' || sESRB === "E10+ - Everyone 10+") {
            return true;
        }
        return false;
    };

    /***
     * parse XML from gamedb.com
     * @param {String} xml
     * @param {String} sGame, game name
     * @param {String} sURL, 
     * @returns {object} {sName {string} : game name, aImages {array} : image path strings}
     ***/
    var parseXML = function(xml, sGame, sURL) {
        var parseString = xml2js.parseString;
        var aOutputImages = [];
        parseString(xml, function(err, result) {
            if (err !== null) {
                process.stdout.write("\nAn error occurred processing game data from " + sURL + ":" + xml + ".", err); // Print the error if one occurred
                //process.exit(0);
                return false;
            }

            //console.log(util.inspect(result, false, null));
            if (!Array.isArray(result.Data.Game) || result.Data.Game.length === 0) {
                process.stdout.write("Game not found, skipping.");
                return false;
            }

            if (bChildSafeOnly && isChildSafeRated(result.Data.Game[0].ESRB) === false) {
                process.stdout.write("Not rated for children, skipping.");
                return false;
            }

            if (!Array.isArray(result.Data.Game[0].Images) || result.Data.Game[0].Images.length === 0) {
                process.stdout.write("No images available, skipping.");
                return false;
            }

            //only using images categorised as fanart (not screenshots)
            var aSourceImageList = result.Data.Game[0].Images[0].fanart;

            if (!Array.isArray(aSourceImageList) || aSourceImageList.length === 0) {
                console.log("No wallpaper size images available, skipping.");
                return false;
            }

            var sDownloadURL = result.Data.baseImgUrl[0];

            for (i = 0; i < aSourceImageList.length; i++) {

                //check width match
                if ((typeof oCmdlineParams.width !== "undefined") && (parseInt(oCmdlineParams.width, 10) !== parseInt(+aSourceImageList[i].original[0].$.width, 10))) {
                    continue;
                }

                //check height match
                if ((typeof oCmdlineParams.height !== "undefined") && (parseInt(oCmdlineParams.height, 10) !== parseInt(+aSourceImageList[i].original[0].$.height, 10))) {
                    continue;
                }


                aOutputImages.push(sDownloadURL + aSourceImageList[i].original[0]._);
                iImagesDownloaded++; //this should be incremented only on success.

                //halt when images found === user specified limit
                if (aOutputImages.length === iLimit) {
                    break;
                }
            }
            process.stdout.write("..." + aOutputImages.length + " found.");
        });

        return {
            sName: sGame,
            aImages: aOutputImages
        };
    }

    process.stdout.write("\nDownloading wallpapers...")
    processList();
};

module.exports = {
    getFiles: _getFiles,
    createDirectory: _createDirectory,
    download: _download
};