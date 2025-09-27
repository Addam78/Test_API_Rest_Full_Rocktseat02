import {fastify} from "fastify"
import {db} from './database.js'
import knex from "knex"
import { randomUUID } from "crypto"
import {hash} from 'bcrypt'
//import { hash } from "crypto"
import z from 'zod'

const app = fastify()

//DEFINIÇÃO DOS SALTOS PARA HAS DA SENHA
const SALT_ROUNDS =10

//ROTA PARA RETORNO DOS USUARIOS CADASTRADOS
app.get('/',(req,reply) =>{
    const filter = db.select().table('users')
    return filter
})

//ROTA DE CADASTRO, PEGAR NOME,SENHA E VINCULAR AO BANCO
app.post('/register',async (req,reply) =>{
    try {

        //TRATIVA TIPAGEM DOS DADOS COM ZOD
        const createUserBodySchema = z.object({
            name:z.string().nonempty().min(2),
            email: z.string(),
            password:z.string().min(4).max(20)
        })

        //PASSANDO OS ARQUIVOS PARA A VARIAVEL
        const {name,email,password} = createUserBodySchema.parse(req.body)
        const password_hash = await hash(password,SALT_ROUNDS)
        //INSERT NO BANCO
        const NewUser ={
            id:randomUUID(),
            name,
            email,
            password:password_hash
        }

        await db('users').insert(NewUser)
    }catch(error){
        return error
    }

})


app.listen({port:3333})