#!/bin/sh

npm -g i

if ! getent group soundfics > /dev/null ; then
    groupadd -r soundfics
fi

if ! getent passwd soundfics  ; then
    useradd -r -g soundfics -s /bin/false soundfics
fi

install -m 644 soundfics.service /etc/systemd/system
systemctl enable soundfics
systemctl daemon-reload
