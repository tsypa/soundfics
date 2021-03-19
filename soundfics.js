'use strict'

let fs = require('fs')
let map = require('lodash.map')
let random = require('lodash.random')
let net = require('net')
let path = require('path')
let winston = require('winston')

let daemonize = process.env.SOUNDFICS_DAEMONIZE

const parseSpawnArg = (args) => {
  const all = args.split(' ')
  return {
    command: all.shift(),
    args: all
  }
}

let config = {
  fics: {
    host: process.env.SOUNDIFICS_FICSHOST || 'freechess.org',
    port: process.env.SOUNFICS_FICSPORT || '5000'
  },
  soundfics: {
    listen: process.env.SOUNDFICS_LISTEN || '127.0.0.1',
    port: process.env.SOUNDFICS_PORT || '5000'
  },
  backLight: process.env.SOUNDFICS_BACKLIGHT || 'true',
  logLevel: process.env.SOUNDFICS_LOGLEVEL || 'error',
  play: parseSpawnArg(process.env.SOUNDFICS_PLAY || 'aplay')
}

if (daemonize === undefined) {
  daemonize = false
}

if (daemonize) {
  require('daemon')({
    cwd: process.cwd(),
  })
}

let fics = {
  state: false,
  login: false,
  game: {
    state: false,
    white: false,
    black: false
  }
}

let transports = []

if (config.daemonize) {
  transports.push(new (winston.transports.File)({filename: 'soundfics.log'}))
} else {
  transports.push(new (winston.transports.Console)({colorize: true}))
}

let logger = winston.createLogger({
  level: config.logLevel,
  transports: transports
})

logger.info('soundfics started')

const soundBase = path.join(__dirname, 'sounds')
let sounds = {}

fs.readdirSync(soundBase).forEach(key => {
  let keyDir = path.join(soundBase, key)
  sounds[key] =  map(fs.readdirSync(keyDir), f  =>  `${keyDir}/${f}`)
})

let spawn = require('child_process').spawn

function play(file) {
  config.play.args.push(file)
  spawn(config.play.command, config.play.args)
  config.play.args.pop()
}

function getLogin(data) {
  let matches = /\*{4}\sStarting\sFICS session as (.+) \*{4}/.exec(data)
  return matches && matches.length > 1 ? matches[1] : false
}

function getAction(s) {
  // check that we logged in

  let login = getLogin(s)
  if (login) {
    return {id: 'login', login: login}
  }

  // check that is new game
  let matches = /{Game.+\((\w+)\svs.\s(\w+)\)\sCreating.+}/.exec(s)
  if (matches && matches.length === 3) {
    return {id: 'start', white: matches[1], black: matches[2]}
  }

  // check that game is over
  matches = /{Game.+\((\w+)\svs.\s(\w+)\).+}\s(.+)-(\d)/.exec(s)
  if (matches && matches.length > 4) {
    return {
      id: 'end',
      players: {white: matches[1], black: matches[2]},
      result: {white: matches[3], black: matches[3] === '*' ? '*' : matches[4], s: s}
    }
  }

  // check aborted game
  matches = /{Game.+\((\w+)\svs.\s(\w+)\) Game aborted on move\s\d+}/.exec(s)
  if (matches && matches.length == 3) {
    return {
      id: 'abort',
      players: {white: matches[1], black: matches[2]}
    }
  }

  // check that is style12
  matches = /(<12>)\s((\S+\s){8})([B|W])\s(-*\d)\s(\d)\s(\d)\s(\d)\s(\d)\s(\d+)\s(\d+)\s(\w+)\s(\w+)\s(-*\d)\s(\d+)\s(\d+)\s(\d+)\s(\d+)\s(\d+)\s(\d+)\s(\d+)\s([BKNPQRa-ho1-8\-\/=]*)\s(\(.+\))\s([BKNPQRa-h1-8Ox+\-=]*)/.exec(s)

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
    }
  }
  return false
}

function getRandomSound(sounds, key) {
  let files = sounds[key]
  return files[random(files.length - 1)]
}

function action(data, sounds) {
  let playData = []
  let s = data.toString('ascii')

  logger.silly('data', s)

  let action = getAction(s)

  if (action) {
    logger.debug(action)
  }

  if (action.id === 'login') {
    fics.login = action.login
    playData.push(getRandomSound(sounds, 'login'))
  } else if (action.id === 'start') {
    playData.push(getRandomSound(sounds, 'start'))
    fics.game.state = 'progress'
    fics.game.white = action.white
    fics.game.black = action.black
  } else if (action.id === 'move') {
    if (action.notation.verbose[0] === 'o') {
      playData.push(getRandomSound(sounds, 'castle'))
    } else if (action.notation.pretty.indexOf('+') !== -1) {
      playData.push(getRandomSound(sounds, 'check'))
      if (config.backLight) {
        playData.push(getRandomSound(sounds, 'grunt'))
      }
    } else if (action.notation.pretty.indexOf('x') !== -1) {
      playData.push(getRandomSound(sounds, 'capture'))
      if (config.backLight) {
        playData.push(getRandomSound(sounds, 'punch'))
      }
    } else {
      playData.push(getRandomSound(sounds, 'move'))
    }
  } else if (action.id === 'end') {
    logger.debug('fics', fics)
    if (action.result.white === action.result.black) {
      playData.push(getRandomSound(sounds, 'draw'))
    } else {
      let myColor = action.players.white === fics.login ? 'white' : 'black'
      if ((myColor === 'white' && parseInt(action.result.white))
          || (myColor === 'black' && parseInt(action.result.black))) {
        playData.push(getRandomSound(sounds, 'win'))
      } else {
        playData.push(getRandomSound(sounds, 'lose'))
      }
    }
    fics.game = {state: false, white: false, black: false}
    if (fics.state === 'logout') {
      logout(fics)
    }
  } else if (action.id === 'abort') {
    playData.push(getRandomSound(sounds, 'abort'))
    fics.game = {white: false, black: false}
  }

  playData.forEach(file => {
    logger.debug('play', file)
    play(file)
  })
}

function logout(fics) {
  logger.debug('logout called')
  if (!fics.game.state) {
    fics.game.white = false
    fics.game.black = false
    fics.login = false
    fics.state = false
  } else {
    fics.state = 'logout'
  }
}

let proxy = net.createServer((proxySocket) => {
  logger.debug('proxy socket created')
  let buffers = []
  let ficsSocket = new net.Socket()
  logger.debug('before FICS connect', config.fics.host, config.fics.port)
  ficsSocket.connect(config.fics.port, config.fics.host, () => {
    buffers.forEach(buffer => {
      ficsSocket.write(buffer)
    })
  })

  proxySocket.on('data', data => {
    if (ficsSocket.writable) {
      ficsSocket.write(data)
    } else {
      buffers[buffers.length] = data
    }
    console.log('data', data)
    action(data, sounds)
  })

  ficsSocket.on('data', data => {
    proxySocket.write(data)
    action(data, sounds)
  })

  proxySocket.on('error', error => {
    logger.debug('proxy socket error event with', error)
    ficsSocket.end()
    logout(fics)
  })

  ficsSocket.on('error', error => {
    logger.debug('fics socket error event with', error)
    proxySocket.end()
    logout(fics)
  })

  proxySocket.on('close', error => {
    if (error) {
      logger.error('error on proxy connection closing', error)
    } else {
      logger.debug('proxy connection closed')
    }
    ficsSocket.end()
    logout(fics)
  })

  ficsSocket.on('close', error => {
    if (error) {
      logger.error('error on fics connection closing', error)
    } else {
      logger.debug('fics connection closed')
    }
    proxySocket.end()
    logout(fics)
  })
})

proxy.listen(config.soundfics.port, config.soundfics.listen)
