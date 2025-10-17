import {app} from '../app.js'
import type { FastifyInstance } from "fastify"
import db from "../database.js"
import {email, z} from 'zod'
import { title } from "process"
import { randomUUID, type UUID } from "crypto"
import {hash} from 'bcrypt'
import { cookie_authorization } from '../middlewares/authorization.js'
import knex from 'knex'


const SALT_ROUNDS =10

export  async function routes(app:FastifyInstance) {

  app.get('/', {
    schema: {
      description: 'Lista todos os usuários cadastrados',
      tags: ['Usuarios'],
      response: {
        200: {
          description: 'Lista de usuários retornada com sucesso',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' }
            }
          }
        }
      }
    }
  }, async (req, reply) => {
    const users = await db.select('id', 'name', 'email').from('users')
    return users
  })

//ROTA DE CADASTRO, PEGAR NOME,SENHA E VINCULAR AO BANCO
app.post('/registrar', {
    schema: {
        description: 'Registrar um novo usuário no sistema',
        tags: ['Registrar Usuários'],
        body: {
            type: 'object',
            required: ['name', 'email', 'password'],
            properties: {
                name: {
                    type: 'string',
                    minLength: 2,
                    description: 'Nome do usuário',
                    examples: ['João Silva']
                },
                email: {
                    type: 'string',
                    format: 'email',
                    description: 'Email do usuário',
                    examples: ['joao.silva@gmail.com']
                },
                password: {
                    type: 'string',
                    minLength: 4,
                    maxLength: 20,
                    description: 'Senha do usuário (será armazenada com hash)',
                    examples: ['senha123']
                }
            }
        },
        response: {
            201: {
                description: 'Usuário cadastrado com sucesso',
                type: 'string'
            },
            400: {
                description: 'Erro de validação ou dados duplicados',
                type: 'object',
                properties: {
                    error: {
                        type: 'string'
                    }
                }
            },
            500: {
                description: 'Erro interno do servidor',
                type: 'object',
                properties: {
                    error: {
                        type: 'string'
                    }
                }
            }
        },
        security: []
    }
},
  async (req,reply) =>{
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

        if (existingUser) {
           return reply.code(400).send('Nome  ja existentes')
        }
        if(verifica_email){
            return reply.code(400).send('email ja existentes')
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
    app.post('/acessar', {
    schema: {
        description: 'Realizar login e criar sessão do usuário',
        tags: ['Acesso a API'],
        body: {
            type: 'object',
            required: ['name_user', 'email_user'],
            properties: {
                name_user: {
                    type: 'string',
                    minLength: 2,
                    maxLength: 10,
                    description: 'Nome do usuário',
                    examples: ['Maicon']
                },
                email_user: {
                    type: 'string',
                    format: 'email',
                    description: 'Email do usuário',
                    examples: ['maicondouglas@gmail.com']
                }
            }
        },
        response: {
            200: {
                description: 'Login realizado com sucesso',
                type: 'string'
            },
            400: {
                description: 'Dados inválidos',
                type: 'object',
                properties: {
                    error: {
                        type: 'string'
                    }
                }
            },
            404: {
                description: 'Usuário não encontrado',
                type: 'object',
                properties: {
                    error: {
                        type: 'string'
                    }
                }
            }
        },
        security: []
    }
},async (req, reply) => {

        const createUserBodySchema = z.object({
            name_user: z.string().min(2).max(10),
            email_user: z.string()
        })

        const { name_user, email_user } = createUserBodySchema.parse(req.body)


        const existingUser = await db('users').select('name','email').where({ name: name_user, email:email_user}).first()
        
        console.log(existingUser)
        
        if (!existingUser) {
            return 'Usario não cadastrado'
        }

        else {
            let cookieSession = req.cookies.cookieSession

            if (!cookieSession) {
                cookieSession = randomUUID()

                reply.cookie('cookieSession', cookieSession, {
                    path: '/',
                    maxAge: 60 * 60 * 24 * 7
                })


                await db('users').where({ email: email_user, name: name_user }).update({
                    'session_cookie': cookieSession
                })

            }

            return "Login com sucesso"

        }

})
//VERIFICAÇÃO DE COOKIES
app.get('/validar_cadastro',{preHandler : [cookie_authorization]
  } , async(req,reply)=>{
        //BUSCA DE SESSION COOKIE
        const cookie_session = req.cookies.cookieSession
        const user = await db('users').where('session_cookie',cookie_session).first().select('id', 'name','session_cookie')
        
        if(!user){
            return 'Sessão expirada'
        }
        return user   
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
        time_meal:z.string().transform((val,ctx) =>{
            const date = new Date(val)
        }),  
        diet:z.enum(['s','n'])
       
     })

    const user = await db('users')
        .where('session_cookie', cookie_session) 
        .first();

    const{name_meal,description_meal,time_meal,diet} = RegisterMealBodySchema.parse(req.body)
    
    await db.transaction(async (trx) =>{

      const new_meal_id = randomUUID()
      const [inserted_meal_id] = await trx('meal').insert({
        id:new_meal_id,
        name_meal,
        description_meal,
        diet
       
      }).returning('id')
      console.log(inserted_meal_id.id)

      await trx('user_meal').insert({
        id:randomUUID(),
        user_id:user.id,
        meal_id:inserted_meal_id.id,
        time_meal:time_meal

      })
    })
    
    reply.send(`Lanche ${name_meal} cadastrado com sucesso`)

})


//VERIFICAR_LANCHE
app.get('/verifica_lanche', {preHandler : [cookie_authorization]} ,async (req, reply) => {

  const cookie_session = req.cookies.cookieSession;

  const user = await db('users')
    .select('id')
    .where('session_cookie', cookie_session)
    .first();
    

  if (!user) {
    return reply.status(401).send({ error: 'Usuário inválido ou sessão expirada' });
  }
 
  const view = await db('meal')
    .join('user_meal','meal.id', '=', 'user_meal.meal_id')
    .join( 'users', 'user_meal.user_id', '=', 'users.id')
    .where('user_meal.user_id', user.id) 
    .select(
      'user_meal.meal_id',
      'users.name',
      'meal.name_meal',
      'meal.diet'
    )

    const count = await db('meal')
    .join('user_meal', 'meal.id', '=', 'user_meal.meal_id')
    .where('user_meal.user_id', user.id)
    .count('* as total');

    const totalRefeicoesdentrodieta = await db('meal')
  .join('user_meal', 'meal.id', '=', 'user_meal.meal_id')
  .join('users', 'users.id', '=', 'user_meal.user_id')
  .where('meal.diet', 's')
  .andWhere('users.id', user.id) // substitua user.id pelo ID do usuário
  .count('meal.diet as Refeicoes_dentro_da_dieta')

   const totalRefeicoesforadieta= await db('meal')
  .join('user_meal', 'meal.id', '=', 'user_meal.meal_id')
  .join('users', 'users.id', '=', 'user_meal.user_id')
  .where('meal.diet', 'n')
  .andWhere('users.id', user.id) // substitua user.id pelo ID do usuário
  .count('meal.diet as Refeicoes_fora_dieta')


  //.groupBy('meal.name_meal');
    
    return {
      view,
      count,
      totalRefeicoesdentrodieta,
      totalRefeicoesforadieta,
    }
  
});

app.post('/alterar_lanche',{preHandler : [cookie_authorization]},async (req,reply)=>{
    
  try {
    const verifica_cookie = req.cookies.cookieSession
  
    const id_usuario = await db('users').select('id').where({ 'session_cookie': verifica_cookie }).first()
 
    const meal_id = await db('meal')
      .join('user_meal','meal.id', '=', 'user_meal.meal_id')
      .join( 'users', 'user_meal.user_id', '=', 'users.id')
      .select('user_meal.meal_id')
      .where('users.session_cookie', verifica_cookie)
      .first()

    if (!verifica_cookie) {
      return 'error'

    } else {
      //PASSAR OS REQ.BODY DO USUARIOS
      const { id_meal_update, name_meal_update, description_meal_update, diet_meal_update } = req.body as {
        name_meal_update: string
        description_meal_update: string
        id_meal_update: UUID
        diet_meal_update : string
      }

      //CRIANDO TRANSACTION
      await db.transaction(async(trx) =>{
      //     await trx('user_meal').update({
      //   meal_id: id_meal_update,
      // })

      await trx('meal').update({
        name_meal: name_meal_update,
        description_meal: description_meal_update,
        diet: diet_meal_update
      }).where({ 'id': id_meal_update })
     
    })
     return 'lanche alterado'
    } 
    
  }
  catch (error) {
    console.error(error)
  }

})


app.post('/visualizacao_unica_lanche',{preHandler : [cookie_authorization]},async(req,reply) =>{
    
  const cookie_session = req.cookies.cookieSession;
  const { name_search } = req.body as {
    name_search: string
  }

  try {

    const viewunica = await db('meal')
      .join('user_meal','meal.id', '=', 'user_meal.meal_id')
      .join( 'users', 'user_meal.user_id', '=', 'users.id')
      .select('meal.name_meal', 'meal.description_meal','meal.diet')
      .where('meal.name_meal', name_search)
      .andWhere('session_cookie', cookie_session)
      .first()

    if(!viewunica){
      return 'Lanche não existe'
    }
    else{
       return viewunica
    } 
   

  }

  catch (error) {
    console.error
  }
}) 

//DELETAR LANCHE
app.delete('/deletar/:id',{preHandler : [cookie_authorization]},async(req,reply) =>{
  
  try{
       const {id} = req.params as {
      id:UUID
    }

    await db('meal').where({id}).delete()
    await db('user_meal').where({'meal_id': id}).delete()
    
    return reply.status(200).send(`Lanche deletado com sucesso`) 
  }

  catch(error){
    return error
  }
      
})



}
