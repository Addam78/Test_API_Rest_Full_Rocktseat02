import {fastify} from "fastify"
import {db} from './database.js'
import knex from "knex"
import { randomUUID } from "crypto"
import {hash} from 'bcrypt'
//import { hash } from "crypto"
import z, { email } from 'zod'
import { _email } from "zod/v4/core"
import cookie from '@fastify/cookie'


const app = fastify()

//IMPORT DE COOKIES
app.register (cookie)


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

//LOGIN 
app.post('/diet',async(req,reply) =>{
    const  {name_user,email_user} = req.body
    

    const teste = await db('users').select().where({name:name_user,email:email_user})
    
    if(teste){
        
        let cookieSession = req.cookies.cookieSession

        if(!cookieSession){
            cookieSession = randomUUID()

             reply.cookie('cookieSession',cookieSession,{
            path:'/',
            maxAge: 60 * 60 * 24 * 7
        })

        await db('users').where({email:email_user,name:name_user}).update({
            'session_cookie':cookieSession
        })

        }

        return "Login com sucesso"

    }else{
        return 'Usario não cadastrado'
    }

      
})
//VERIFICAÇÃO DE COOKIES
app.get('/register_launch',async(req,reply)=>{
    //BUSCA DE SESSION COOKIE
    const cookie_session = req.cookies.cookieSession
    if (!cookie_session){
        return 'usuario não autenticado'
    }else{
        const user = await db('users').where('session_cookie',cookie_session).first().select('id', 'name')
        
        if(!user){
            return 'Sessão expirada'
        }
        return user
        
    }


})

app.post('/meal',async (req,reply)=>{
    //ADIICONAR VERIFICAÇÃO DE COOKIE

    //TRATIVA DOS DADOS 
    const RegisterMealBodySchema= z.object({
        name_meal:z.string().min(2),
        description_meal:z.string().min(2),
        time_meal:z.string().transform((val,ctx) =>{
            const date = new Date(val)
        })

        
     })
    //PASSANDO O METODO REQ.BODY PARA PUXAR OS ITENS

    // Supondo que o cookie de sessão se chame 'session_id'
    const cookie_session = req.cookies.cookieSession
    
    
    if (!cookie_session) {
        return null; // Nenhuma sessão enviada
    }

    // 1. BUSCA NO BANCO (Exemplo: Usando o session_id para encontrar o usuário)
    // Se o seu token de sessão estiver armazenado na tabela 'users' (ou em uma tabela 'sessions')
    const user = await db('users')
        .where('session_cookie', cookie_session) // Assumindo que você armazena o token na coluna 'session_token'
        .first();

   // return user ? user.id : null; 

    const{name_meal,description_meal,time_meal} = RegisterMealBodySchema.parse(req.body)
    
    await db('meal').insert({
        id:randomUUID(),
        name_meal,
        description_meal,
        time_meal,
        user_id:user.id
         
    })


   
})


app.get('/verifica_lanche', async (req, reply) => {
  // 1. Pega o cookie da requisição
  const cookie_session = req.cookies.cookieSession;

  if (!cookie_session) {
    return reply.status(401).send({ error: 'Sessão não encontrada' });
  }

  // 2. Busca o usuário pelo cookie para descobrir seu ID
  const user = await db('users')
    .select('id')
    .where('session_cookie', cookie_session)
    .first();

  if (!user) {
    return reply.status(401).send({ error: 'Usuário inválido ou sessão expirada' });
  }

  // 3. Faz a consulta com JOIN e filtro pelo ID do usuário
  const view = await db('meal')
    .join('users', 'meal.user_id', '=', 'users.id')
    .where('meal.user_id', user.id) // só os lanches desse usuário
    .select(
      'meal.name_meal',
      'meal.description_meal',
      'meal.user_id',
      'users.id',
      'users.name as user_name',
      'users.email'
    );

  return view;
});




app.listen({port:3333})