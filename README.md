A application for bulk downloading wallpapers based on the games in a users steam library. Makes use of the steamAPI and the API available at [thegamesdb.net](http://thegamesdb.net)

## Usage

The following command line options are available

### Compulsory options. At a minimum these are required.
**--steamAPIkey, -k** steam API key, see [http://steamcommunity.com/dev/apikey](http://steamcommunity.com/dev/apikey) . Enter 127.0.0.1 if you do not have a website.

--steamId, -i, Target Steam Account id. See [https://steamcommunity.com/sharedfiles/filedetails/?id=209000244](https://steamcommunity.com/sharedfiles/filedetails/?id=209000244) for further information on determining your steam id.

### Optional
**--limit**, **-l**, Image download limit. Specify the number of wallpaper images that will be downloaded per game. If omitted, the default is 3.

**--outputdir**, **-d**, 'Specify an output directory (relative path) for downloaded images. If the specified directory does not exist it will be created. When this option is omitted ./images is written to.

**--width**, **-x**, Match only images with this width dimension, in pixels.

**--height**, **-y**, Match only images with this height dimension, in pixels.

**--childsafe**, **-c**, Retrieve images only from those games with an ESRB rating of 'E - Everyone' or 'E10+ - Everyone 10+"'. Unrated games are skipped.

**--overwrite**, **-o**, Will re-download a wallpaper if the file already exists locally. Default is to skip an existing file.

**--help**, **-h**  output help message

### Sample settings

download only 1080p images to /images

`node index.js --steamid 12345678901234567 --steamAPIkey 12345678901234567890123456789012 -x 1920 -y 1080`

download childsafe game wallpapers to /wallpapers, overwriting any exising content

`node index.js --steamid 12345678901234567 --steamAPIkey 12345678901234567890123456789012 -o -d wallpapers -c`