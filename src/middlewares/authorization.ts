import { error } from 'console';
import type { FastifyReply, FastifyRequest } from 'fastify';

export async function cookie_authorization (request:FastifyRequest,reply:FastifyReply) {
    const cookie_session = request.cookies.cookieSession;

    if(!cookie_session){
        return reply.status(401).send({
            error : 'Usuario não autorizado'
        })
    }

} 