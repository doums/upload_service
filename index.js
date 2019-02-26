import '@babel/polyfill'
import Koa from 'koa'
import serve from 'koa-static'
import fs from 'fs'
import path from 'path'

const app = new Koa()

app.use(async ctx => {
  ctx.body = 'Hello World'
})

app.listen(2001, () => console.log('upload service starts listening to port 2001'))