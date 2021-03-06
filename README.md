# soundfics
[![npm version][npm-image]][npm-url]
[![Downloads][downloads-image]][downloads-url]

FICS proxy which pumps up traffic by sound

## Motivation
I like to play on FICS under Linux with xboard.<br>
But I am not satisfied with native Xboard's acoustic behaviour.<br>
So, soundfics is designed to sound a chess traffic between FICS and FICS client <br>
Tested with **Xboard**, **Jin**, **eboard**

## Requirements
- Unix flavor OS (Linux or other)
- nodejs
- npm
- aplay
- FICS account (optional)

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
put FICS login and password in ~/.icsrc.<br>
then run your favorite FICS client (e.g. xboard) with disabled sounds
```
xboard -ics -icshost 127.0.0.1 -icshelper timeseal -soundMove ""
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
|backlight|backlight base sound or not|true|

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
- add cheers sound

## License
soundfics is released under the MIT license.

[npm-image]: https://img.shields.io/npm/v/soundfics.svg?style=flat-square
[npm-url]: https://npmjs.org/package/soundfics
[downloads-image]: http://img.shields.io/npm/dm/soundfics.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/soundfics
