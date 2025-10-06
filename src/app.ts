import {fastify, type FastifyInstance} from "fastify"
import {db} from './database.js'
import knex from "knex"
import { randomUUID, type UUID } from "crypto"
import {hash} from 'bcrypt'
//import { hash } from "crypto"
import z, { email } from 'zod'
import { _email } from "zod/v4/core"
import cookie from '@fastify/cookie'
import {fastifySwagger} from '@fastify/swagger'
import {fastifySwaggerUi} from '@fastify/swagger-ui'
import {routes} from '../routes/routes.js'

export const app = fastify()

//IMPORT DE COOKIES
app.register (cookie)
app.register(routes)

app.register(fastifySwagger,{
    openapi:{
        info :{
            title:'Desafio Rockteseat',
            version:'1.0.0'
        }
    }
})
app.register(fastifySwaggerUi, {
    routePrefix :'/docs',
})
//DEFINIÇÃO DOS SALTOS PARA HAS DA SENHA
const SALT_ROUNDS =10
