#! /usr/bin/env node

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

async function fileReadWithRecursion (directoryPath, showDir = true, showFile = true, findName = '', exclude = '', hidden = false) {

  let files = await readdir(directoryPath)

  if (!hidden) {
    files = files.filter(item => !item.startsWith('.'))
  }

  for (let i = 0; i < files.length; ++i) {

    let fileName = files[i]

    let filePath = path.join(directoryPath, fileName)

    let stats = await stat(filePath)

    let isFile = stats.isFile()
    let isDir  = stats.isDirectory()

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

      await fileReadWithRecursion(filePath, showDir, showFile, findName, exclude, hidden)
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
    await fileReadWithRecursion(dPath, !!program.directory, !!program.file, (program.fname ? program.fname : ''), (program.exclude ? program.exclude : ''), !!program.hidden)
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
