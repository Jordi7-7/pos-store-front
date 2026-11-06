import { SignIn } from '../application/use-cases/sign-in';
import { AuthHttpRepository } from './repositories/auth.http-repository';

/** Raíz de composición del módulo: enchufa la implementación HTTP a los casos de uso. */
export const authRepository = new AuthHttpRepository();
export const signIn = new SignIn(authRepository);
