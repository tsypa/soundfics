#!/bin/sh

GLOBAL=''

if [ "$(id -u)" = "0" ]; then
    GLOBAL='-g'
fi

npm ${GLOBAL} c set soundfics:ficshost freechess.org
npm ${GLOBAL} c set soundfics:ficsport 5000
npm ${GLOBAL} c set soundfics:listen 127.0.0.1
npm ${GLOBAL} c set soundfics:port 5000
npm ${GLOBAL} c set soundfics:backlight true
npm ${GLOBAL} c set soundfics:loglevel error
npm ${GLOBAL} c set soundfics:daemonize true
