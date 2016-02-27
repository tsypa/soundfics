# soundfics
A proxy which play sounds for chess moves and events highlighted from the FICS traffic

## Motivation
I like to play on FICS under Linux with xboard.<br>
But I am not satisfied with native Xboard's acoustic behaviour.<br>
So, soundfics designed to sounds a chess traffic from FICS to FICS client <br>
Tested clients is **Xboard**, **Jin**

## Requirements
- Unix flavor OS (Linux or other)
- nodejs
- npm
- aplay

## Installation
```
sudo npm -g i soundfics
```
## Usage

### cli
```
soundfics (status|start|stop|restart)
```
You can run soundfics with 
```
soundfics start
```
then run your favorite FICS client (e.g. xboard) with disabled sounds
```
xboard -ics -icshost 127.0.0.1 -icshelper timeseal -size medium
```

### Configuration
Soundfics has several confguration options

|Option|Description|Default value|
|------|-----------|-------------|
|ficshost|FICS hostname or address|freechess.org|
|ficsport|FICS port number|5000|
|listen|listen address|127.0.0.1|
|port|soundfics port number|5000|
|daemonize|daemon mode|true|
|loglevel|winston log level|error|
|backlight|baclight base sound or not|true|

You can change configuration options by npm.
For example
```
npm config set soundfics:backlight false
```
Tells to soundfics to sound something like Fritz<br>
'backlight' option pumps up a base sound by additional sounds

|Base|Addition|
|----|------|
|check|grunt|
|capture|punch|

## Roadmap
- add different sound schemes

## License
soundfics is released under the MIT license.
