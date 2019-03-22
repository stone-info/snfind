// let [arg, pid]    = process.argv.splice(2);
let [name]    = process.argv.slice(2)
const chalk   = require('chalk')
const util    = require('util')
const fs      = require('fs')
const stat    = util.promisify(fs.stat)
const readdir = util.promisify(fs.readdir)
const path    = require('path')

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

    let stats
    try {
      stats = await stat(filePath)
    } catch (err) {
      // console.log('link file', filePath)
      continue
    }
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

async function worke ({
  file,
  directoryPath,
  showDir,
  showFile,
  findName,
  exclude,
  hidden,
}) {
  let filePath = path.join(directoryPath, file)

  let stats
  try {
    stats = await stat(filePath)

    let isFile = stats.isFile()
    let isDir  = stats.isDirectory()

    if (isFile) {
      if (showFile) {
        showFilePath(filePath, file, findName)
      } else {
        if (!showDir) {
          showFilePath(filePath, file, findName)
        }
      }
    }

    if (isDir) {
      await fileReadWithRecursion(filePath, showDir, showFile, findName, exclude, hidden)
    }
  } catch (err) {
    // console.log('link file', filePath)
  }
}

process.on('message', async (msg) => {
  if (msg === 'exit') {
    process.exit(0)
  } else {
    // console.log(msg)

    // console.log(msg.data);
    // console.log(`\x1b[42m${'进程 ' + name + ' 开始工作...'}\x1b[0m`)
    await worke(msg.data)

    process.send({ data: { ok: true } })
  }
})

