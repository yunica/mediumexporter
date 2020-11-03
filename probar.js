const mediumexporter = require('./index.js')

const url = 'https://medium.com/devseed/cog-talk-part-2-mosaics-bbbf474e66df'
async function example() {
  mediumexporter.getPost(url, {
    output: 'posts',
    frontmatter: true
  })
}
example()
