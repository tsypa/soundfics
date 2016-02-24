'use strict';

require('daemon')();

let fs = require('fs');
let net = require('net');
let _ = require('lodash');
// let Sound = require('node-aplay');

let ficsPort = '5000';
let ixMove = 1;
let ixCapture = 1;

let fics = {
  login: false,
  game: {
    white: false,
    black: false
  }
};

let config = {
  fics: {
    host: process.env.npm_package_config_proxy || 'freechess.org',
    port: process.env.npm_package_config_ficsport || '5000'
  },
  proxy: {
    port: process.env.npm_package_config_proxy || '5000'
  },
  backLight: process.env.npm_package_config_backlight || true
};

function getLogin(data) {
  let matches = /\*{4}\sStarting\sFICS session as (.+) \*{4}/.exec(data);
  return matches && matches.length > 1 ? matches[1] : false;
}

function getAction(s) {
  // check that we logged in

  let login = getLogin(s);
  if (login) {
    return {id: 'login', login: login};
  };

  // check that is new game
  let matches = /{Game.+\((\w+)\svs.\s(\w+)\)\sCreating.+}/.exec(s);
  if (matches && matches.length === 3) {
    return {id: 'start', white: matches[1], black: matches[2]};
  }

  // check that game is over
  matches = /{Game.+\((\w+)\svs.\s(\w+)\).+}\s(.+)-(\d)/.exec(s);
  if (matches && matches.length > 4) {
    return {
      id: 'end',
      players: {white: matches[1], black: matches[2]},
      result: {white: matches[3], black: matches[3] === '*' ? '*' : matches[4]}
    };
  }

  // check that is style12
  matches = /(<12>)\s((\S+\s){8})([B|W])\s(-*\d)\s(\d)\s(\d)\s(\d)\s(\d)\s(\d)\s(\d+)\s(\w+)\s(\w+)\s(-*\d)\s(\d)\s(\d)\s(\d+)\s(\d+)\s(\d+)\s(\d+)\s(\d+)\s([BKNPQRa-ho1-8\-\/]*)\s(\(.+\))\s([BKNPQRa-h1-8Ox+\-]*)/.exec(s);

  if (matches && matches.length > 24) {
    return {
      id: 'move',
      board: matches[2],
      color: matches[4],
      dpp: matches[5],
      names: { white: matches[12], black: matches[13]},
      relation: matches[15],
      time: {initial: matches[15], increment: matches[16]},
      strength: {white: matches[17], black: matches[18]},
      remainingTime: {white: matches[19], black: matches[20]},
      moveNumber: matches[21],
      notation: {verbose: matches[22], pretty: matches[24]}
    };
  }

  return false;
};

function getRandomSound(sounds, key) {
  let files = sounds[key];
  return files[_.random(files.length - 1)];
};

function action(data, sounds) {
  let playData = [];
  let s = data.toString('ascii');
  let action = getAction(s);

  // if (action) {
  //   console.log(action);
  // }

  if (action.id === 'login') {
    fics.login = action.login;
    playData.push(getRandomSound(sounds, 'login'));
  } else if (action.id === 'start') {
    playData.push(getRandomSound(sounds, 'start'));
    fics.game.white = action.white;
    fics.game.black = action.black;
  } else if (action.id === 'move') {
    if (action.notation.verbose[0] === 'o') {
      playData.push(getRandomSound(sounds, 'castle'));
    } else if (action.notation.pretty.indexOf('+') !== -1) {
      playData.push(getRandomSound(sounds, 'check'));
      if (config.backLight) {
        playData.push(getRandomSound(sounds, 'pain'));
      }
    } else if (action.notation.pretty.indexOf('x') !== -1) {
      playData.push(getRandomSound(sounds, 'capture'));
      if (config.backLight) {
        playData.push(getRandomSound(sounds, 'backlight'));
      }
    } else {
      playData.push(getRandomSound(sounds, 'move'));
    }
  } else if (action.id === 'end') {
    if (action.result.white === action.result.black) {
      // draw
      playData.push(getRandomSound(sounds, 'end'));
    } else {
      let myColor = action.players.white === fics.login ? 'white' : 'black';
      if ((myColor === 'white' && parseInt(action.result.white))
          || (myColor === 'black' && parseInt(action.result.black))) {
        playData.push(getRandomSound(sounds, 'applause'));
        playData.push(`winapplause${_.random(1, 5)}.wav`);
      } else {
        playData.push(getRandomSound(sounds, 'end'));
      }
    }
    fics.game = {white: false, black: false};
  }

  playData.forEach(file => {
    play(file);
  });
}

function logout(fics) {
  fics.game = {white: false, black: false};
  fics.login = false;
}

let soundBase = `${__dirname}/sounds`;
let sounds = {};

fs.readdirSync(`${soundBase}`).forEach(key => {
  sounds[key] =  _.map(fs.readdirSync(`${soundBase}/${key}`), f  =>  `${soundBase}/${key}/${f}`);
});

let spawn = require('child_process').spawn;
let exec = require('child_process').exec;

function play(file) {
  spawn('aplay', [file]);
}

let proxy = net.createServer(proxySocket => {
  let buffers = [];
  let ficsSocket = new net.Socket();

  ficsSocket.connect(config.fics.port, config.fics.host, () => {
    buffers.forEach(buffer => {
      ficsSocket.write(buffer);
    });
  });

  proxySocket.on('data', data => {
    if (ficsSocket.writable) {
      ficsSocket.write(data);
    } else {
      buffers[buffers.length] = data;
    }
    action(data, sounds);
  });

  ficsSocket.on('data', data => {
    proxySocket.write(data);
    action(data, sounds);
  });

  proxySocket.on('error', error => {
    // console.log(error);
    ficsSocket.end();
    logout(fics);
  });

  ficsSocket.on('error', error => {
    // console.log(error);
    proxySocket.end();
    logout(fics);
  });

  proxySocket.on('close', error => {
    // console.log('proxy connection closed', error);
    ficsSocket.end();
    logout(fics);
  });

  ficsSocket.on('close', error => {
    // console.log('FICS connection closed', error);
    proxySocket.end();
    logout(fics);
  });
});

proxy.listen(config.fics.port, '127.0.0.1');
