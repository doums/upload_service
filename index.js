import '@babel/polyfill'
import Koa from 'koa'
import Router from 'koa-router'
import koaBody from 'koa-body'
import serve from 'koa-static'
import fs from 'fs'
import path from 'path'
import uuidv4 from 'uuid/v4'

const IMAGES_DIR = path.join(__dirname, './images')
const HOSTNAME = 'http://localhost:2001'
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

// PUT /image, upload an image
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
    const reader = fs.createReadStream(file.path)
    const stream = fs.createWriteStream(path.join(IMAGES_DIR, imageName))
    reader.pipe(stream)
    console.log('uploading %s -> %s', file.name, stream.path)
  } catch (e) {
    ctx.throw(500, `error occurred while uploading: ${e.message()}"`)
  }
  ctx.status = 201
  ctx.body = { url: `${HOSTNAME}/${imageName}` }
})

/* todo replace by http method DELETE (router.del(...)) when koa-body will have fixed it
    see https://github.com/dlau/koa-body/issues/133 */
router.post('/image', koaBody(), ctx => {
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