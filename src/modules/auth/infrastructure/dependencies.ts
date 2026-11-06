import { SignIn } from '../application/sign-in';
import { AuthHttpRepository } from './auth.http-repository';

/** Raíz de composición del módulo: enchufa la implementación HTTP a los casos de uso. */
export const authRepository = new AuthHttpRepository();
export const signIn = new SignIn(authRepository);
