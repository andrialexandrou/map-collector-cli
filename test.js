const path = require('path')
const fs = require('fs')

const excludes = [
    'node_modules'
]

function findJsFiles(base, files, result) {
    base = base || '.'
    files = files || 
        base && fs.readdirSync(base)
    result = result || []

    files.forEach(file => {
        if (excludes.includes(base)) {
            return
        }

        const newBase = path.join(base, file)
        if (fs.statSync( newBase ).isDirectory() ) {
            result = findJsFiles(newBase, fs.readdirSync(newBase), result)
        } else {
            if (file.slice(-3) === '.js') {
                result.push(newBase)
            }
        }
    })
    return result
}

function formatForWindows(file) {
    return file.replace(/\\/g, '\/')
}

process.env.NODE_ENV = 'test'
const files = findJsFiles()
files.forEach(file => {
    const fullPath = path.join(__dirname, file)
    require(fullPath)
})