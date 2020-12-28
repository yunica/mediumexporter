/* eslint-disable */
const path = require('path')
const fs = require('fs')
const r2 = require('r2')
const slugify = require('underscore.string/slugify')
const utils = require('./utils')

let options = {}

function createFolder(path) {
  try {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true })
    }
  } catch (err) {
    // may exist already, ignore
    console.error(err)
  }
}

module.exports = async function(mediumURL, params = {}) {
  let options = params

  if (!mediumURL || mediumURL.substr(0, 18) !== 'https://medium.com') {
    throw new Error('no url or not a medium.com url')
  }

  let output = null
  const json = await utils.loadMediumPost(mediumURL, options)
  const s = json.payload.value
  // add id options
  options.id = s.id
  const story = {}
  const images = []
  story.title = s.title.replace(/:/g, '&#58;')
  story.subtitle = s.virtuals.subtitle.trim().replace(/:/g, '&#58;')
  story.lead = s.virtuals.subtitle.trim().replace(/:/g, '&#58;')
  story.author = s.displayAuthor
  story.date = new Date(s.firstPublishedAt || s.createdAt).toJSON()
  story.slug = s.slug
  story.url = mediumURL
  story.images = []
  story.id = s.id
  if (s.virtuals.tags) {
    story.tags = s.virtuals.tags.map(t => t.name)
  }
  if (s.license && s.license !== 0) {
    story.license = s.license
  }

  // If the author's not available, get it from somewhere else
  const authors = []
  if (json.payload.references && json.payload.references.User) {
    Object.keys(json.payload.references.User).forEach(k => {
      const u = json.payload.references.User[k]
      authors.push({
        name: u.name,
        username: u.username,
        userId: u.userId
      })
    })
    story.authors = authors

    if (!story.author) {
      story.author = authors[0].name
      story.author_username = authors[0].username
    }
  }

  if (s.virtuals.previewImage) {
    story.featuredImage = utils.image2file(
      s.virtuals.previewImage.imageId,
      options
    )
  }

  if (params && params.info) {
    process.exit(0)
  }

  if (params) {
    output = params.output ? params.output : 'content'
  } else {
    output = process.env.PWD
  }

  story.sections = s.content.bodyModel.sections
  story.paragraphs = s.content.bodyModel.paragraphs

  const sections = []
  for (let i = 0; i < story.sections.length; i++) {
    const s = story.sections[i]
    const section = utils.processSection(s, story.slug, images, options)
    sections[s.startIndex] = section
  }

  if (story.paragraphs.length > 1) {
    if (
      /^[b|B][y|Y]( ?)[:]/.test(story.paragraphs[0].text) &&
      story.paragraphs[0].text.length < 50
    ) {
      story.author = story.paragraphs[0].text.replace(/^[b|B][y|Y]( ?)[:]/, '')
    }
    if (
      /^[b|B][y|Y]( ?)[:]/.test(story.paragraphs[1].text) &&
      story.paragraphs[1].text.length < 50
    ) {
      story.author = story.paragraphs[1].text.replace(/^[b|B][y|Y]( ?)[:]/, '')
    } else {
      story.subtitle = story.paragraphs[1].text
    }
  }

  story.markdown = []
  story.markdown.push(`\n# ${story.title.replace(/\n/g, '\n# ')}`)
  if (story.subtitle) {
    story.markdown.push(`\n${story.subtitle.replace(/#+/, '')}`)
  }

  let lastParagraph = null
  story.paragraphs = story.paragraphs.filter((p, idx) => {
    if (p.type === 8 && lastParagraph && lastParagraph.type === 8) {
      lastParagraph.text += `\n\n${p.text}`
      return false
    }
    lastParagraph = p
    return true
  })

  const promises = []
  for (let i = 2; i < story.paragraphs.length; i++) {
    if (sections[i]) story.markdown.push(sections[i])

    const promise = new Promise(function(resolve, reject) {
      const p = story.paragraphs[i]

      const text = utils.processParagraph(p, story.slug, images, options)
      return resolve(text)
    })
    promises.push(promise)
  }

  return Promise.all(promises)
    .then(async results => {
      if (images.length) {
        const { featuredImage } = story
        let outputPath = path.join(output, 'media')
        if (options.jekyll) {
          outputPath = path.join(output, `assets/media/${story.slug}`)
        }
        createFolder(outputPath)
        story.images = await utils.downloadImages(images, {
          featuredImage,
          imageFolder: outputPath,
          id: options.id
        })
      } else {
        createFolder(output)
      }

      for (const text of results) {
        story.markdown.push(text)
      }

      if (params && params.debug) {
        console.log('debug', story.paragraphs)
      }
      story.author = (story.author || '')
        .trim()
        .replace('  ', ' ')
        .replace(/ /g, '-')
        .toLowerCase()

      // frontmatter
      let outputText = ''
      if (options.frontmatter) {
        outputText = '---\n'
        outputText += `id: ${story.id}\n`
        outputText += `slug: ${story.slug}\n`
        outputText += `title: "${story.title}"\n`
        outputText += `author: "${story.author}"\n`
        // outputText += `author_url: ${story.author_username || ''}\n`
        outputText += `lead: ""\n`
        if (story.subtitle) {
          let teaser = story.subtitle.trim()
          if (teaser.length > 150) {
            teaser = teaser.substr(0, 146).split(' ')
            teaser = `${teaser.slice(0, teaser.length - 1).join(' ')} ...`
          }
          outputText += `teaser: "${teaser}"\n`
        } else {
          outputText += `teaser: ""\n`
        }
        outputText += `date: ${story.date}\n`

        // media
        outputText += 'media:\n'
        outputText += `  card:\n`
        if (story.featuredImage) {
          outputText += `    url: ./media/${story.featuredImage}\n`
        } else {
          outputText += `    url: \n`
        }
        // topics
        if (story.tags.length > 0) {
          outputText += 'medium_topics:\n'
          for (const tag of story.tags) {
            outputText += `  - ${tag}\n`
          }
        }
        outputText += `medium_link: "${story.url}"\n`
        outputText += '---\n'
      }
      outputText += story.markdown.join('\n')

      let outputPath = `${output}/${story.date.slice(0, 10)}-${story.slug}.md`

      if (output) {
        if (!!images.length && !options.jekyll) {
          outputPath = `${output}/${story.date.slice(0, 10)}-${story.slug}.md`
        }
        fs.writeFileSync(outputPath, outputText)
        // return post object if required, else just exit
        return options.returnObject ? story : undefined
      }
      if (!output && params && params.commands) {
        return outputText
      }
      return outputText
    })
    .catch(err => {
      console.log('something went wrong -- internal')
      console.log(err)
      return err
    })
}
