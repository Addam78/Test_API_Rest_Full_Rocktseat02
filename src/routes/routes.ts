import {app} from '../app.js'
import type { FastifyInstance } from "fastify"
import db from "../database.js"
import {email, uuid, z} from 'zod'
import { title } from "process"
import { randomUUID, type UUID } from "crypto"
import {hash} from 'bcrypt'
import { cookie_authorization } from '../middlewares/authorization.js'
import knex from 'knex'
import { id } from 'zod/v4/locales'
import { error } from 'console'


const SALT_ROUNDS =10

export  async function routes(app:FastifyInstance) {

  app.get('/',async (req, reply) => {
    const users = await db.select('id', 'name', 'email').from('users')
    return reply.code(200).send(users)
  })

//ROTA DE CADASTRO USUARIO
app.post('/registrar',async (req,reply) =>{
    
  try {
        //TRATIVA TIPAGEM DOS DADOS COM ZOD
        const createUserBodySchema = z.object({
            name:z.string().nonempty().min(2),
            email: z.string(),
            password:z.string().min(4).max(20)
        })

        // Extraindo os dados do corpo da requisição
        const { name, email, password } = createUserBodySchema.parse(req.body)
        //VERIFICAR SE EXISTE NOME OU EMAIL EXISTENTE 
        const existingUser = await db('users').where({ name}).first();
        const verifica_email = await db('users').where({email}).first()

        if (existingUser ) {
           return reply.code(409).send('Nome ja existente')
        }
        if(verifica_email){
          return reply.code(409).send('endereço de email ja existente')
        }
       
        //PASSANDO OS ARQUIVOS PARA A VARIAVEL E HABILITANDO HASH
        const password_hash = await hash(password, SALT_ROUNDS)
        
        //INSERT NO BANCO
        const NewUser ={
            id:randomUUID(),
            name,
            email,
            password:password_hash
        }

        await db('users').insert(NewUser)
        reply.code(201).send('Usuario cadastrado com sucesso')
    }catch(error){
        return error
    }

})


//ROTAR PARA FAZER LOGIN
    app.post('/acessar',async (req, reply) => {
        const createUserBodySchema = z.object({
            name_user: z.string().min(2).max(10),
            email_user: z.string()
        })

        const { name_user, email_user } = createUserBodySchema.parse(req.body)
        const existingUser = await db('users').select('name','email').where({ name: name_user, email:email_user}).first()
        
        
        if (!existingUser) {
            return reply.code(409).send('Usario não cadastrado')
        }

        else {
          //ADICIONA COOKIE ASSIM QUE USUARIO FIZER LOGIN
            let cookieSession = req.cookies.cookieSession

            if (!cookieSession) {
                cookieSession = randomUUID()

                reply.cookie('cookieSession', cookieSession, {
                    path: '/',
                    maxAge: 60 * 60 * 24 * 7
                })


                await db('users').where({ email: email_user, name: name_user })
                .update({'session_cookie': cookieSession})
            }

           reply.code(200).send('Acesso autorizado')

        }

})

//VERIFICAÇÃO DE COOKIES
app.get('/validar_cadastro',{preHandler : [cookie_authorization]
  } , async(req,reply)=>{
        //BUSCA DE SESSION COOKIE
        const cookie_session = req.cookies.cookieSession
        
        const user = await db('users').where('session_cookie',cookie_session).first().select('id', 'name','session_cookie')
        if(!user){
            return reply.code(401).send('Sessão expirada') 
        }

        reply.code(200).send('Cadastrado validado com sucesso')
})


//INSERIR LANCHE
app.post('/inserir_lanche',{preHandler : [cookie_authorization]},
 async (req,reply)=>{
  
    //ADIICONAR VERIFICAÇÃO DE COOKIE
    const cookie_session = req.cookies.cookieSession
    //TRATIVA DOS DADOS  TABELA MEAL
    const RegisterMealBodySchema= z.object({
        name_meal:z.string().min(2),
        description_meal:z.string().min(2),

        time_meal:z.string().pipe(z.coerce.date()),
        

        diet:z.enum(['s','n'])
     })
     

     //PEGAR O ID DO USUARIO DE ACORDO COM O COOKIE DA SESSÃO
    const user = await db('users').select('id')
        .where('session_cookie', cookie_session) 
        .first();

    const{name_meal,description_meal,time_meal,diet} = RegisterMealBodySchema.parse(req.body)
    
   
    await db('meal').insert({
      id:randomUUID(),
      name_meal,
      description_meal,
      time_meal,
      user_id:user.id,
      diet

    })
    reply.code(201).send(`Lanche ${name_meal} cadastrado com sucesso`)

})


//VERIFICAR_LANCHE
app.get('/verifica_lanche', {preHandler : [cookie_authorization]} ,async (req, reply) => {

  const cookie_session = req.cookies.cookieSession;

  const user = await db('users')
    .select('id')
    .where('session_cookie', cookie_session)
    .first();
    
  if (!user) {
    return reply.code(401).send({ error: 'Usuário inválido ou sessão expirada' });
  }
 
  const view = await db('meal')
    .join( 'users', 'meal.user_id', '=', 'users.id')
    .where('meal.user_id', user.id) 
    .select(
      'meal.id',
      'users.name',
      'meal.name_meal',
      'meal.diet',
      db.raw(`
            strftime('%Y-%m-%d %H:%M:%S', 
                datetime(meal.time_meal / 1000, 'unixepoch', 'localtime')
            ) as time_meal_formatado
        `)
      
    )

    const count = await db('meal')
    .join('users', 'meal.user_id', '=', 'users.id')
    .where('meal.user_id', user.id)
    .count('* as total');

  const totalRefeicoesdentrodieta = await db('meal')
  .join('users', 'meal.user_id', '=', 'users.id')
  .where('meal.diet', 's')
  .andWhere('meal.user_id', user.id) // substitua user.id pelo ID do usuário
  .count('meal.diet as Refeicoes_dentro_da_dieta')

  const totalRefeicoesforadieta = await db('meal')
  .join('users', 'meal.user_id', '=', 'users.id')
  .where('meal.diet', 'n')
  .andWhere('meal.user_id', user.id) // substitua user.id pelo ID do usuário
  .count('meal.diet as Refeicoes_fora_da_dieta')


    return {
      view,
       count,
      totalRefeicoesdentrodieta,
       totalRefeicoesforadieta,
      
    }
  
});



app.post('/alterar_lanche',{preHandler: [cookie_authorization]},async (req,reply) =>{
  try {
  const verifica_cookie = req.cookies.cookieSession;

  // PEGA ID DO USUARIO LOGADO
  const user = await db('users')
    .select('id')
    .where('session_cookie', verifica_cookie) 
    .first();

  
  if(!user){
    return reply.code(401).send({ error: 'Sessão inválida ou expirada' });
  }

  // PASSAR OS REQ.BODY DO USUARIOS
  const { id_meal_update, name_meal_update, description_meal_update, diet_meal_update } = req.body as {
    name_meal_update: string
    description_meal_update: string
    id_meal_update: UUID
    diet_meal_update: string
  }


  const meal = await db('meal')
    .where({
      'id': id_meal_update,
      'user_id': user.id
    })
    .first()

  if(!meal){
    return reply.code(404).send({ error: 'Lanche não encontrado ou você não tem permissão' });
  }

  // Atualiza o lanche
  const alterar = await db('meal')
    .update({
      name_meal: name_meal_update,
      description_meal: description_meal_update,
      diet: diet_meal_update
    })
    .where({ 'id': id_meal_update });

    return reply.code(200).send('Lanche atualizado com sucesso')
  
} catch (error) {
  return reply.code(500).send({ error: 'Erro ao alterar lanche' });
}

})

app.post('/visualizacao_unica_lanche',{preHandler : [cookie_authorization]},async(req,reply) =>{
    
  const cookie_session = req.cookies.cookieSession;
  //VALIDAÇÃO DO LANCHE
  const { name_search } = req.body as {
    name_search: string
  }

  try {

    const viewunica = await db('meal')
      .join('users', 'meal.user_id', '=', 'users.id')
      .select('meal.name_meal', 'meal.description_meal','meal.diet')
      .where('meal.name_meal', name_search)
      .andWhere('session_cookie', cookie_session)
      .first()

    if(!viewunica){
      return reply.code(404).send('Lanche não existe')
    }
    else{
       return reply.code(200).send(viewunica)
    } 
  }

  catch (error) {
    return reply.code(404).send({error: 'Lanche não existe ou foi digitado de forma incorreta'})
  }
}) 

//DELETAR LANCHE
app.delete('/deletar/:id',{preHandler : [cookie_authorization]},async(req,reply) =>{
  
  const cookie_session = req.cookies.cookieSession;
  
  try{
       const {id} = req.params as {
      id:UUID
    }

    const user = await db('users')
        .select('id') // Pega o ID do usuário
        .where('session_cookie', cookie_session)
        .first();

    if (!user) {
        return reply.code(401).send({ error: 'Sessão inválida ou expirada.' });
    }

      const meal = await db('meal')
      .where('id', id)
      .first();

    if (!meal) {
      return reply.code(404).send({ error: 'Lanche não encontrado.' });
    }

    // 3. Verifica se o lanche pertence ao usuário logado
    if (meal.user_id !== user.id) {
      return reply.code(403).send({ error: 'Você não tem permissão para deletar este lanche.' });
    }

    // 4. Deleta o lanche
    await db('meal')
      .where({
        'id': id,
        'user_id': user.id  // Segurança extra
      })
      .delete();
  

       return reply.code(200).send(`Lanche deletado com sucesso`) 
    }
    
  catch(error){
    return reply.code(404).send('lanche não encontrado')
  }
      
})



}
