import '@babel/polyfill'
import Koa from 'koa'
import Router from 'koa-router'
import koaBody from 'koa-body'
import serve from 'koa-static'
import fs from 'fs'
import os from 'os'
import path from 'path'

const app = new Koa()
const router = new Router()

app.on('error', err => {
  console.error('server error', err)
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

// CORS
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*')
  ctx.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, CONNECT, OPTIONS, TRACE, PATCH')
  ctx.set('Access-Control-Allow-Headers', 'Content-Type')
  await next()
})

app.use(serve(path.join(__dirname, '/public')))

router.post('/image', koaBody({ multipart: true }), async ctx => {
  const file = ctx.request.files.file;
  const reader = fs.createReadStream(file.path);
  const stream = fs.createWriteStream(path.join(os.tmpdir(), Math.random().toString()));
  reader.pipe(stream);
  console.log('uploading %s -> %s', file.name, stream.path);
  ctx.status = 200
})

app
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(2001, () => console.log('upload service starts listening to port 2001'))