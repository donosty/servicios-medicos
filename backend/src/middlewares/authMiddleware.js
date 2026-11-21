import {
  COOKIE_NAME,
  getSessionUser,
  logoutSession,
} from '../services/authService.js';

export const readCookie = (request, name) => {
  const cookies = request.headers.cookie ? request.headers.cookie.split(';') : [];
  for (const cookie of cookies) {
    const separator = cookie.indexOf('=');
    if (separator === -1) continue;
    const key = cookie.slice(0, separator).trim();
    if (key === name) {
      return decodeURIComponent(cookie.slice(separator + 1).trim());
    }
  }
  return null;
};

export const getSessionCookieOptions = (isDeletion = false) => {
  const secure = process.env.NODE_ENV === 'production';
  return [
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    secure ? `Secure` : null,
    isDeletion ? `Max-Age=0` : `Max-Age=${7 * 24 * 60 * 60}`,
  ].filter(Boolean).join('; ');
};

export const requireAuth = async (request, response, next) => {
  try {
    const token = readCookie(request, COOKIE_NAME);
    const user = await getSessionUser(token);
    if (!user) return response.status(401).json({ message: 'Inicia sesión para continuar.' });
    request.usuario = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

export const requireRole = (role) => (request, response, next) => {
  if (!request.usuario || request.usuario.role !== role) {
    return response.status(403).json({ message: 'No tienes permisos para esta vista.' });
  }
  return next();
};

export const setSessionCookie = (response, token) => {
  response.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; ${getSessionCookieOptions()}`,
  );
};

export const clearSessionCookie = (response) => {
  response.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; ${getSessionCookieOptions(true)}`,
  );
};

export { logoutSession };
