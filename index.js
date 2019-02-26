import '@babel/polyfill'
import Koa from 'koa'
import Router from 'koa-router'
import koaBody from 'koa-body'
import serve from 'koa-static'
import fs from 'fs'
import path from 'path'

const IMAGES_DIR = path.join(__dirname, './images')

const app = new Koa()
const router = new Router()

fs.access(IMAGES_DIR, fs.constants.F_OK | fs.constants.W_OK, err => {
  if (err && err.code === 'ENOENT') {
    fs.mkdirSync(IMAGES_DIR)
  } else if (err) {
    console.error(`${IMAGES_DIR} is read-only`)
  }
})

app.use(koaBody({ multipart: true }))

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

router.put('/image', koaBody(), async ctx => {
  const files = ctx.request.files
  if (!files) {
    ctx.throw(400, `no image sent!`)
  }
  const file = files[Object.keys(files)[0]]
  if (!file.type.startsWith('image/')) {
    ctx.throw(415, 'images only!')
  }
  const reader = fs.createReadStream(file.path)
  const stream = fs.createWriteStream(path.join(IMAGES_DIR, Math.random().toString()))
  reader.pipe(stream)
  console.log('uploading %s -> %s', file.name, stream.path)
  ctx.status = 200
})

app
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(2001, () => console.log('upload service starts listening to port 2001'))