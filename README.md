# soundfics
A proxy which play sounds for chess moves and events highlighted from the FICS traffic
## Motivation
Soundfics is designed to be sound replacement if you use FICS client without good acoustinc behaviour
## Requirements
- Unix flavor OS (Linux or other)
- nodejs
- npm
- aplay

# Installation
```
npm -g i soundfics
```
# Usage
## cli
```
soundfics (status|start|stop|restart)
```
You can run soundfics with *** soundfics start ***
then run your favorite FICS client with sounds disabled (for example xboard)
```
xboard -ics -icshost 127.0.0.1 -icshelper timeseal -size medium
```
## Configuration
Soundfics has several confguration options

|Option|Description|Default value|
|------|-----------|-------------|
|ficshost|FICS hostname or address|freechess.org|
|ficsport|FICS port number|5000|
|listen|listen address|127.0.0.1|
|port|soundfics port number|5000|
|daemonize|daemon mode|true|
|loglevel|winston log level|error|
|backlight|sound backlight|true|

You can change configuration options by npm.
For example
```
npm -g c soundfics:backlight false
```
Will tell the soundfics to sound something like Fritz<br>
Backlight adds additional sounds to base Fritz sounds like

|Base|Addition|
|----|------|
|check|grunt|
|capture|punch|

# Roadmap
- add different sound schemes

# License
soundfics is released under the MIT license.
