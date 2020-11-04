const mediumexporter = require('./index.js')
var fs = require('fs')

const CSVToJSON = require('csvtojson')
var inputFile = './DevSeed-MediumPosts-all_posts.csv'

async function workMedium(url, count) {
  await mediumexporter.getPost(url, {
    output: 'posts',
    frontmatter: true
  })
  console.info(`done =>> ${url} =>> ${count} `)
}

// async function processArray(array) {
//   let count = 0
//   for (let item of array) {
//     // item = array[item];
//     const url = item.post_url.split('?')[0]
//     try {
//       await mediumexporter.getPost(url, {
//         output: 'posts',
//         frontmatter: true
//       })
//       console.info(`done =>> ${item.post_id} =>> ${count} `)
//       count++
//     } catch (error) {
//       console.error(`=========>> ${url}`)
//     }
//   }
// }

// // CSVToJSON().fromFile(inputFile)
// //   .then(row => {
// //     // console.log(row);
// //     console.warn(row.length)
// //     processArray(row);
// //   }).catch(err => {
// //     console.log(err);
// //   });

// (async () => {
//   try {
//     const results = await CSVToJSON().fromFile(inputFile);
//     const promises = []
//     let count = 0
//     for (const row of results) {
//       const promise = new Promise(function (resolve, reject) {
//         const url = row.post_url.split('?')[0]
//         const row_promise = workMedium(url, count)
//         count++
//         resolve(row_promise)
//         reject(`no funciono =>> ${url}`)
//       })
//       promises.push(promise)
//     }

//     Promise.all(promises)
//       .then(r => {
//         console.warn('links trabajados', r)
//       })
//       .catch(err => {
//         console.log('something went wrong external')
//         console.log(err)
//       })
//   } catch (err) {
//     console.log('something went wrong main')
//     console.log(err);
//   }
// })();

workMedium('https://medium.com/devseed/cog-talk-part-2-mosaics-bbbf474e66df')
