

// //IMPORTAÇÃO DOS ARQUIVOS DENTRO E DOCMENTATION
// import { userPaths } from '../swagger/documentation/userdoc.js'
// import { registrarUserDoc} from './documentation/registrarUserDoc.js'
// import {acessarDoc} from './documentation/acessarDoc.js'



// export async function swaggerSetup(app) {
//   await app.register(fastifySwagger, {
//     openapi: {
//       openapi: '3.0.0',
//       info: {
//         title: 'Desafio Rocketseat',
//         version: '1.0.0',
//         description: 'Documentação da API separada por módulos',
//       },
//       tags: [
//         { name: 'Usuários', description: 'Rotas relacionadas a usuários' },
//       ],
//       paths: {
//         userPaths,
//         registrarUserDoc,
//         acessarDoc,

//          // 👈 adicionando a nova rota
//       },
//     },
//   })

// await app.register(fastifySwaggerUi, {
//     routePrefix :'/docs',
// })
// }