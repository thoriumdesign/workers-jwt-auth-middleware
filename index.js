import { Router } from 'itty-router'
import auth from './auth'

const router = Router()

router.get("/", () => new Response("ok", {status: 200}))

router.get("/public", () => new Response("public", {status: 200}))
router.get("/private", auth, () => new Response("private", {status: 200}))

router.all("*", () => new Response("404, not found!", { status: 404 }))

addEventListener('fetch', (e) => {
  e.respondWith(router.handle(e.request))
})