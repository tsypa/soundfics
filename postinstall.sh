#!/bin/sh

if [ "$(id -u)" = "0" ]; then
    npm -g c set soundfics:ficshost freechess.org
    npm -g c set soundfics:ficsport 5000
    npm -g c set soundfics:proxyport 5000
    npm -g c set soundfics:backlight true
    npm -g c set soundfics:loglevel error
    npm -g c set soundfics:daemonize false
fi
