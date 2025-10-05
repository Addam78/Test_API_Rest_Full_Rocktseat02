
import {app} from '../src/app.js'
import type { FastifyInstance } from "fastify"
import db from "../src/database.js"
import {email, z} from 'zod'
import { title } from "process"
import { randomUUID, type UUID } from "crypto"
import {hash} from 'bcrypt'


const SALT_ROUNDS =10

export  async function routes(app:FastifyInstance) {
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

       

        // Extraindo os dados do corpo da requisição
        const { name, email, password } = createUserBodySchema.parse(req.body)

        const existingUser = await db('users').where({ name}).first();
        const verifica_email = await db('users').where({email}).first()

        if (existingUser) {
            return reply.status(400).send({ error: 'Nome de usuário já existe' });
        }
        if(verifica_email){
            return 'email existente'
        }
     

        //PASSANDO OS ARQUIVOS PARA A VARIAVEL
        const password_hash = await hash(password, SALT_ROUNDS)
        
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
    const  {name_user,email_user} = req.body as {
        name_user:string,
        email_user:string

    }
    
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
        const user = await db('users').where('session_cookie',cookie_session).first().select('id', 'name','session_cookie')
        
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
      'users.email',
      
    );

  return view;
});

app.post('/alteralanche',async (req,reply)=>{
    //ALTERAR OS DADOS -->UPDATE , COM VERIFICAÇÃO DE COOKIE E PRIMARY KEY
    try{
    //PEGAR ID DO LANCHE POR MEIO DO COOKIE DO USUARIO LOGADO
    //BUSCAR NO BANCO O ID DO LANCHE POR MEIO DO COOKIE DO USUARIO
    //VERIFICAR O COOKIE ANTES
    //SELECIOEN O LANCHE ONDE TEM COOKIE INNER JOIN ID.USER , INNER JOIN MEAL 
    
    const verifica_cookie = req.cookies.cookieSession 
    console.log(verifica_cookie)
    
    //ID DO USARIO
    const id_usuario = await db('users').select('id').where({'session_cookie':verifica_cookie}).first()
    console.log('id do usuario')
    console.log(id_usuario)
    
    //ID DO LANCHE COM BASE USUARIO LOGADO 
    const meal_id = await db('meal')
    .join('users', 'meal.user_id', '=', 'users.id')
    .select('meal.id')
    .where('users.session_cookie', verifica_cookie)
    .first()
    
    console.log('id  do lanche')
    console.log(meal_id)

    if(!verifica_cookie){
        return 'error'
        
    }else{        
        //PASSAR OS REQ.BODY DO USUARIOS
        const {id_meal_update ,name_meal_update, description_meal_update } = req.body as {
            name_meal_update: string
            description_meal_update: string
            id_meal_update:UUID
        }
      
    
   await db('meal').update({
    id: id_meal_update,
    name_meal: name_meal_update,
    description_meal: description_meal_update
  }).where({ 'id':id_meal_update})
  
 
    }
    
}
    catch(error){
        console.error(error)
    }

 

})


app.post('/visualizacaounica',async(req,reply) =>{
    //PARA VISUALZIAR UMA UNICA REFEIÇÃO, NECESSARIO ID
    //CRIAR POR TIPO DE NOME
    const cookie_session = req.cookies.cookieSession;

    // const user_id = await db('users').select('id').where({
    //     'id':cookie_session
    // })
    // console.log(user_id)

    if (!cookie_session) {
    return reply.status(401).send({ error: 'Sessão não encontrada' });
    }

    const {name_search} = req.body as {
        name_search:string
    }

    const id_user = await db('users').select('id')
    .where('session_cookie', cookie_session)
    .first();
       
    
    console.log(name_search)

    try{

    //      const viewunica = await db('meal')
    // .join('users','meal.user_id', '=', 'users.id')
    // .select('meal.name_meal','meal.description_meal')
    // .where({'meal.name_meal':name_search})
    // .andWhere('meal.user_id', '=', db.ref('users.id'))
    // .andWhere( {'user.session_cookie':cookie_session})
    // .first()
    // return viewunica
      const viewunica = await db('meal')
    .join('users', 'meal.user_id', '=', 'users.id')
    .select('meal.name_meal', 'meal.description_meal')
    .where('meal.name_meal', name_search)
    .andWhere('session_cookie',cookie_session)
    //.andWhere('meal.user_id', id_user)   // 🔥 filtro pelo usuário logado
    .first()

   


  return viewunica
    }
    
    catch(error){
        console.error
    }
   
    

}) 


  
}
