import {fastify, type FastifyInstance} from "fastify"
import {db} from './database.js'
import knex from "knex"
import { randomUUID, type UUID } from "crypto"
import {hash} from 'bcrypt'
//import { hash } from "crypto"
import dotenv from 'dotenv'
import z, { email } from 'zod'

import 'dotenv/config'
import { _email } from "zod/v4/core"
import cookie from '@fastify/cookie'

import {routes} from './routes/routes.js'

import {fastifySwagger} from '@fastify/swagger'
import {fastifySwaggerUi} from '@fastify/swagger-ui'
export const app = fastify()

//IMPORT DE COOKIES
app.register (cookie)
await app.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Desafio Rocketseat',
        version: '1.0.0',
        description: 'Documentação da API separada por módulos',
      },
      },
    },
  )

await app.register(fastifySwaggerUi, {
    routePrefix :'/docs',
})

app.register(routes)


//DEFINIÇÃO DOS SALTOS PARA HAS DA SENHA
const SALT_ROUNDS =10
