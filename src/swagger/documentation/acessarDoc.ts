// export const acessarDoc = {
//      // Tags são usadas para agrupar rotas na interface do Swagger UI
//     tags: ['Usuários'],
    
//     summary: 'Realiza o login de um usuário e define um cookie de sessão.',
//     description: 'Verifica se o usuário existe (name_user e email_user). Se existir, autoriza o acesso e, se necessário, cria e armazena um novo session_cookie.',
    
//     // Configuração do corpo da requisição (Request Body)
//     body: {
//         type: 'object',
//         required: ['name_user', 'email_user'],
//         properties: {
//             name_user: {
//                 type: 'string',
//                 description: 'O nome de usuário para login.',
//                 minLength: 2,
//                 maxLength: 20
//             },
//             email_user: {
//                 type: 'string',
//                 format: 'email', // Sugestão para validação de e-mail (embora 'z' não valide o formato, é bom para a documentação)
//                 description: 'O e-mail do usuário para login.'
//             }
//         }
//     },

//     // Configuração das respostas (Responses)
//     response: {
//         // Resposta de Sucesso (200 OK)
//         200: {
//             description: 'Acesso autorizado. Um cookie de sessão pode ter sido definido.',
//             type: 'string',
//             example: 'Acesso autorizado'
//         },

//         // Resposta de Erro de Usuário Não Encontrado (409 Conflict - Embora 401 Unauthorized ou 404 Not Found também pudessem ser usados, mantemos o 409 do código original)
//         409: {
//             description: 'Usuário não cadastrado ou credenciais incorretas.',
//             type: 'string',
//             example: 'Usuario não cadastrado'
//         },

//         // Resposta de Erro de Validação (400 Bad Request - Erro do Zod)
//         400: {
//             description: 'Dados de entrada inválidos (ex: nome muito curto, e-mail mal formatado).',
//             type: 'object',
//             properties: {
//                 statusCode: { type: 'number', example: 400 },
//                 error: { type: 'string', example: 'Bad Request' },
//                 message: { type: 'string', example: 'Validation Error' }
//             }
//         }
//     }

// }