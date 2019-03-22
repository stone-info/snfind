#! /usr/bin/env node
const cp      = require('child_process')
const os      = require('os')
const program = require('commander')
const colors  = require('colors/safe')
const chalk   = require('chalk')
const execa   = require('execa')
const util    = require('util')
const fs      = require('fs')
const stat    = util.promisify(fs.stat)
const readdir = util.promisify(fs.readdir)
const path    = require('path')

program
  .version('0.1.0')
  .option('-f --file [file]', 'only search file')
  .option('-d --directory [directory]', 'only search directory')
  .option('-n --fname [fname]', 'find name')
  .option('-e --exclude [exclude]', 'exclude directory')
  .option('-h --hidden [hidden]', 'include hidden file')

program.parse(process.argv)

function cpuCount () {return os.cpus().length}

async function start (directoryPath, showDir = true, showFile = true, findName = '', exclude = '', hidden = false) {

  let files = await readdir(directoryPath)

  if (!hidden) {files = files.filter(item => !item.startsWith('.'))}

  let numCpus

  if (cpuCount() > files.length) {numCpus = files.length} else {numCpus = cpuCount()}

  let count = cpuCount() > files.length ? files.length : cpuCount()

  for (let i = 0; i < count; i++) {
    let file     = files.shift()

    let name     = `subProcess${i}---`

    const script = path.resolve(__dirname, './worker.js')
    const child  = cp.fork(script, [name])

    child.on('error', err => {console.log(`\x1b[41m${err}\x1b[0m`)})

    child.on('exit', async code => {
      if (code === 0) {
        // console.log(`\x1b[42m子进程 ${name} 正常退出...\x1b[0m`)
        numCpus--
        if (numCpus === 0) {
          // console.log(`\x1b[32m${'我是最后一个退出的'}\x1b[0m`)
        }
      } else {
        console.log(`\x1b[41m子进程 ${name} 非正常退出...\x1b[0m`)
      }
    })

    child.on('message', msg => {
      if (msg.data.ok === true) {
        if (files.length > 0) {
          let file = files.shift()
          child.send({ data: { file, directoryPath, showDir, showFile, findName, exclude, hidden } })
        } else {
          child.send('exit')
        }
      } else {

      }
    })

    if (file) {

      child.send({ data: { file, directoryPath, showDir, showFile, findName, exclude, hidden } })
    } else {
      child.send('exit')
    }
  }
}

;(async function () {
  let dPath = execa.shellSync('pwd').stdout

  // console.log(program.directory)
  // console.log(program.file)
  // console.log(program.fname)
  // console.log(program.exclude)


  try {
    // await fileReadWithRecursion(dPath, !!program.directory, !!program.file, (program.fname ? program.fname : ''), (program.exclude ? program.exclude : ''), !!program.hidden)
    await start(
      dPath,
      !!program.directory,
      !!program.file,
      (program.fname ? program.fname : ''),
      (program.exclude ? program.exclude : ''),
      !!program.hidden,
    )
  } catch (err) {
    console.log(`\x1b[31m${err.message}\x1b[0m`)
  }
})()

// if (process.argv.slice(2).length === 0) {
//   program.outputHelp(make_red)
//   process.exit(0)
// }
//
// function make_red (txt) {
//   return colors.red(txt) //display the help text in red on the console
// }
