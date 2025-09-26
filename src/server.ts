import {fastify} from "fastify"

const app = fastify()

app.get('/',(req,reply) =>{
    return reply.send('Hello world')
})

app.listen({port:3333})