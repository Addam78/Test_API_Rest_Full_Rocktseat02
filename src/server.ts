import {fastify} from "fastify"
import {db} from './database.js'

const app = fastify()


//ROTA DE TESTE
app.get('/',(req,reply) =>{
    return reply.send('Hello world')
})

//ROTA DE LOGIN
app.post('/login',(req,reply) =>{
    
})


app.listen({port:3333})