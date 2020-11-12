const mediumexporter = require('./index.js')
var fs = require('fs')

async function workMedium(url) {
  await mediumexporter.getPost(url, {
    output: 'posts',
    frontmatter: true
  })
  console.info(`done =>> ${url}  `)
}

workMedium('https://medium.com/devseed/cog-talk-part-2-mosaics-bbbf474e66df')
