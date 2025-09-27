import {fastify} from "fastify"
import {db} from './database.js'
import knex from "knex"
import { randomUUID } from "crypto"

const app = fastify()


//ROTA DE TESTE
app.get('/',(req,reply) =>{
    const filter = db.select().table('users')
    return filter
})

//ROTA DE CADASTRO, PEGAR NOME,SENHA E VINCULAR AO BANCO
app.post('/register',async (req,reply) =>{
    try {
        const { name, email, password } =  req.body as {
            name: string
            email: string
            password: string

            
        }

        const NewUser ={
            id:randomUUID(),
            name,
            email,
            password

        }

        await db('users').insert(NewUser)
    }catch(error){
        console.error(error)
    }

    //PENDENTE O INSERT NO BANCO
   
})


app.listen({port:3333})