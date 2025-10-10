import {app} from '../app.js'
import type { FastifyInstance } from "fastify"
import db from "../database.js"
import {email, z} from 'zod'
import { title } from "process"
import { randomUUID, type UUID } from "crypto"
import {hash} from 'bcrypt'
import { cookie_authorization } from '../middlewares/authorization.js'


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
                    examples: ['João']
                },
                email_user: {
                    type: 'string',
                    format: 'email',
                    description: 'Email do usuário',
                    examples: ['joao@email.com']
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
}, async (req, reply) => {

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
app.get('/validar_cadastro',{preHandler : [cookie_authorization], schema: {
        description: 'Valida o cadastro do usuário através do cookie de sessão',
        tags: ['Autenticação'],
        //security: [{ cookieAuth: [] }],
        response: {
            200: {
                description: 'Usuário autenticado com sucesso',
                type: 'object',
                properties: {
                    id: { 
                        type: 'string', 
                        format: 'uuid',
                        description: 'ID único do usuário'
                    },
                    name: { 
                        type: 'string',
                        description: 'Nome do usuário'
                    },
                    session_cookie: { 
                        type: 'string',
                        description: 'Cookie de sessão ativo'
                    }
                },
                example: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    name: 'João Silva',
                    session_cookie: 'abc123def456'
                }
            },
            401: {
                description: 'Sessão expirada ou inválida',
                type: 'string',
                example: 'Sessão expirada'
            }
        }
    }
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
app.post('/inserir_lanche',{preHandler : [cookie_authorization]} ,async (req,reply)=>{
    //ADIICONAR VERIFICAÇÃO DE COOKIE
    const cookie_session = req.cookies.cookieSession
    //TRATIVA DOS DADOS 
    const RegisterMealBodySchema= z.object({
        name_meal:z.string().min(2),
        description_meal:z.string().min(2),
        time_meal:z.string().transform((val,ctx) =>{
            const date = new Date(val)
        })  
     })
      

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

    reply.send(`Lanche ${name_meal} cadastrado com sucesso`)

})


//VERIFICAR_LANCHE
app.get('/verifica_lanche', {preHandler : [cookie_authorization]} ,async (req, reply) => {
  // 1. Pega o cookie da requisição
  const cookie_session = req.cookies.cookieSession;

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

app.post('/alterar_lanche',{preHandler : [cookie_authorization]},async (req,reply)=>{
    
  try {

    const verifica_cookie = req.cookies.cookieSession
    // console.log(verifica_cookie)

    //ID DO USARIO
    const id_usuario = await db('users').select('id').where({ 'session_cookie': cookie_authorization }).first()


    //ID DO LANCHE COM BASE USUARIO LOGADO 
    const meal_id = await db('meal')
      .join('users', 'meal.user_id', '=', 'users.id')
      .select('meal.id')
      .where('users.session_cookie', verifica_cookie)
      .first()

    if (!verifica_cookie) {
      return 'error'

    } else {
      //PASSAR OS REQ.BODY DO USUARIOS
      const { id_meal_update, name_meal_update, description_meal_update } = req.body as {
        name_meal_update: string
        description_meal_update: string
        id_meal_update: UUID
      }


      await db('meal').update({
        id: id_meal_update,
        name_meal: name_meal_update,
        description_meal: description_meal_update
      }).where({ 'id': id_meal_update })


    }

  }
  catch (error) {
    console.error(error)
  }



})


app.post('/visualizacao_unica_lanche',{preHandler : [cookie_authorization]},async(req,reply) =>{
    //PARA VISUALZIAR UMA UNICA REFEIÇÃO, NECESSARIO ID
    //CRIAR POR TIPO DE NOME
  const cookie_session = req.cookies.cookieSession;

  const { name_search } = req.body as {
    name_search: string
  }

  const id_user = await db('users').select('id')
    .where('session_cookie', cookie_session)
    .first();

  try {
    const viewunica = await db('meal')
      .join('users', 'meal.user_id', '=', 'users.id')
      .select('meal.name_meal', 'meal.description_meal')
      .where('meal.name_meal', name_search)
      .andWhere('session_cookie', cookie_session)
      .first()
    return viewunica
  }

  catch (error) {
    console.error
  }
}) 


}
