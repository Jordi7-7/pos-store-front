import { RolesHttpRepository } from './repositories/roles.http-repository';
import { UsersHttpRepository } from './repositories/users.http-repository';

/** Raíz de composición del módulo. */
export const usersRepository = new UsersHttpRepository();
export const rolesRepository = new RolesHttpRepository();
