const mediumexporter = require('./index.js')
var fs = require('fs')

async function workMedium(url) {
  await mediumexporter.getPost(url, {
    output: 'posts3',
    frontmatter: true
  })
  console.info(`done ==========  >> ${url} `)
}

const url = process.argv.slice(2)[0].split('?')[0]

workMedium(url)
