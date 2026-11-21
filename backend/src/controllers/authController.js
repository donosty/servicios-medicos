import { registerSchema, loginSchema } from '../validators/authValidator.js';
import {
  registerUser,
  loginUser,
  getSessionUser,
  logoutSession,
  COOKIE_NAME,
} from '../services/authService.js';
import {
  readCookie,
  setSessionCookie,
  clearSessionCookie,
} from '../middlewares/authMiddleware.js';

export const register = async (request, response, next) => {
  try {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: 'Los datos de registro no son válidos.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const user = await registerUser(parsed.data);
    return response.status(201).json({ user });
  } catch (error) {
    return next(error);
  }
};

export const login = async (request, response, next) => {
  try {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: 'Los datos de inicio de sesión no son válidos.',
      });
    }

    const session = await loginUser(parsed.data.email, parsed.data.password);
    setSessionCookie(response, session.token);
    return response.json({ user: session.user });
  } catch (error) {
    return next(error);
  }
};

export const session = async (request, response, next) => {
  try {
    const user = await getSessionUser(readCookie(request, COOKIE_NAME));
    if (!user) return response.status(401).json({ authenticated: false });
    return response.json({ authenticated: true, user });
  } catch (error) {
    return next(error);
  }
};

export const logout = async (request, response, next) => {
  try {
    await logoutSession(readCookie(request, COOKIE_NAME));
    clearSessionCookie(response);
    return response.status(204).send();
  } catch (error) {
    return next(error);
  }
};
