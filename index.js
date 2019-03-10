import '@babel/polyfill'
import Koa from 'koa'
import Router from 'koa-router'
import koaBody from 'koa-body'
import serve from 'koa-static'
import fs from 'fs'
import path from 'path'
import uuidv4 from 'uuid/v4'

const IMAGES_DIR = path.join(__dirname, './images')
const HOSTNAME = 'http://localhost'
const PORT = 2001

const app = new Koa()
const router = new Router()

fs.access(IMAGES_DIR, fs.constants.F_OK | fs.constants.W_OK, err => {
  if (err && err.code === 'ENOENT') {
    fs.mkdirSync(IMAGES_DIR)
  } else if (err) {
    console.error(`${IMAGES_DIR} is read-only`)
  }
})

app.on('error', err => {
  console.log('server error', err)
})

app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    ctx.status = err.status || 500
    ctx.body = err.message
    ctx.app.emit('error', err, ctx)
  }
})

// CORS's needs
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*')
  ctx.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, CONNECT, OPTIONS, TRACE, PATCH')
  ctx.set('Access-Control-Allow-Headers', 'Content-Type')
  await next()
})

// accept CORS preflight request
router.options('/', ctx => {
  ctx.status = 200
})

// GET /image_name, get an image
app.use(serve(IMAGES_DIR))

const storeFS = (filePath, destPath) => {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filePath)
    const writeStream = fs.createWriteStream(destPath)
    writeStream.on('error', error => {
      writeStream.destroy()
      fs.unlinkSync(destPath)
      reject(error)
    })
    readStream
      .on('error', error => {
        fs.unlinkSync(destPath)
        writeStream.destroy()
        reject(error)
      })
      .pipe(writeStream)
      .on('finish', () => resolve())
  })
}

// PUT /image multipart/form-data
router.put('/image', koaBody({ multipart: true }), ctx => {
  const files = ctx.request.files
  if (!files) {
    ctx.throw(400, 'no image sent!')
  }
  const file = files[Object.keys(files)[0]]
  if (!file.type.startsWith('image/')) {
    ctx.throw(415, 'images only!')
  }
  const imageName = `${uuidv4()}.${file.type.slice(6)}`
  try {
    storeFS(file.path, path.join(IMAGES_DIR, imageName))
  } catch (e) {
    ctx.throw(500, `error occurred while uploading: ${e.message()}"`)
  }
  ctx.status = 201
  ctx.body = { url: `${HOSTNAME}:${PORT}/${imageName}` }
})

// DELETE /image application/json
router.del('/image', koaBody({ parsedMethods: ['DELETE'] }), ctx => {
  if (ctx.is('json')) {
    const { url } = ctx.request.body
    if (!url) {
      ctx.throw(400, 'expected payload: { url: "image_url" }')
    }
    const imageName = url.split('/').pop()
    try {
      fs.unlinkSync(`${IMAGES_DIR}/${imageName}`, err => {
        if (err) {
          ctx.throw(500, 'error while deleting file')
        }
      })
    } catch (e) {
      if (e.code !== 'ENOENT') {
        ctx.throw(500, 'error while deleting file')
      }
    }
    ctx.status = 200
  } else {
    ctx.throw(415, 'json only!')
  }
})

app
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(PORT, () => console.log(`listening on port ${PORT}`))