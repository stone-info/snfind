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
  .option('-r --recursion [recursion]', 'recursion default true')
  .option('-d --directory [directory]', 'only search directory')
  .option('-n --fname [fname]', 'find name')
  .option('-e --exclude [exclude]', 'exclude directory')
  .option('-h --hidden [hidden]', 'include hidden file')

program.parse(process.argv)

function showFilePath (filePath, fileName, findName) {
  if (findName === '') {
    console.log(filePath)
  } else {
    if (new RegExp(findName, 'img').test(fileName)) {
      // console.log(filePath)

      let match = fileName.match(new RegExp(findName, 'img'))[0]

      let nFilePath = filePath.substring(0, filePath.lastIndexOf(fileName))
      let nFileName = fileName.replace(match, chalk.red(match))

      console.log(nFilePath + nFileName)

      // console.log(filePath.replace(match, chalk.red(match)))
    }
  }
}

function showDirectoryPath (filePath, fileName, findName) {
  if (findName === '') {

    console.log(chalk.blue.bold(filePath))

  } else {

    if (new RegExp(findName, 'img').test(fileName)) {
      // console.log(chalk.blue.bold(filePath))
      let match = fileName.match(new RegExp(findName, 'img'))[0]

      let nFilePath = filePath.substring(0, filePath.lastIndexOf(fileName))
      let nFileName = fileName.replace(match, chalk.red(match))

      console.log(chalk.blue.bold(nFilePath + nFileName))

      // console.log(chalk.blue.bold(filePath.replace(match, chalk.red(match))))
    }
  }
}

function cpuCount () {return os.cpus().length}

async function recursionOFF (files, directoryPath, showFile, findName, showDir, exclude) {
  for (let i = 0; i < files.length; ++i) {

    let fileName = files[i]

    let filePath = path.join(directoryPath, fileName)

    let stats

    try {stats = await stat(filePath)} catch (err) {continue}

    let isFile = stats.isFile()

    let isDir = stats.isDirectory()

    if (isFile) {
      if (showFile) {
        showFilePath(filePath, fileName, findName)
      } else {
        if (!showDir) {
          showFilePath(filePath, fileName, findName)
        }
      }
    }
    if (isDir) {
      if (exclude !== '') {
        let excludePaths = exclude.split('|').filter(item => item !== '')
        if (excludePaths.includes(fileName)) {continue}
      }

      if (showDir) {
        showDirectoryPath(filePath, fileName, findName)
      } else {
        if (!showFile) {
          showDirectoryPath(filePath, fileName, findName)
        }
      }
    }
  }
}

function recursionON (files, directoryPath, showDir, showFile, findName, exclude, hidden) {

  let numCpus

  if (cpuCount() > files.length) {numCpus = files.length} else {numCpus = cpuCount()}

  let count = cpuCount() > files.length ? files.length : cpuCount()

  for (let i = 0; i < count; i++) {
    let file = files.shift()

    let name = `subProcess${i}---`

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
        //
      }
    })

    if (file) {
      child.send({ data: { file, directoryPath, showDir, showFile, findName, exclude, hidden } })
    } else {
      child.send('exit')
    }
  }
}

async function start (directoryPath, showDir = true, showFile = true, findName = '', exclude = '', hidden = false, recursion = true) {

  let files = await readdir(directoryPath)

  if (!hidden) {files = files.filter(item => !item.startsWith('.'))}

  if (recursion === false) {
    // 递归关闭
    await recursionOFF(files, directoryPath, showFile, findName, showDir, exclude)
  } else {
    // 递归开启
    recursionON(files, directoryPath, showDir, showFile, findName, exclude, hidden)
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
      (program.recursion ? program.recursion === 'true' : true),
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
