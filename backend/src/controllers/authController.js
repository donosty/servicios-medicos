import {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetTokenSchema,
  passwordResetSchema,
  emailConfirmationTokenSchema,
} from "../validators/authValidator.js";
import {
  registerUser,
  reactivateUser,
  loginUser,
  getSessionUser,
  logoutSession,
  requestPasswordReset,
  validatePasswordResetToken,
  cancelPasswordResetToken,
  resetPassword,
  sendEmailConfirmation,
  resendEmailConfirmation,
  confirmEmail,
  COOKIE_NAME,
} from "../services/authService.js";
import {
  readCookie,
  setSessionCookie,
  clearSessionCookie,
} from "../middlewares/authMiddleware.js";

export const register = async (request, response, next) => {
  try {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Los datos de registro no son válidos.",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const user = await registerUser(parsed.data);
    let verificationEmailSent = true;
    try {
      verificationEmailSent = await sendEmailConfirmation(user.userId);
    } catch (error) {
      verificationEmailSent = false;
      console.error(
        "No fue posible enviar el correo de confirmación:",
        error.message,
      );
    }
    return response.status(201).json({ user, verificationEmailSent });
  } catch (error) {
    if (error.code === "ACCOUNT_INACTIVE") {
      return response
        .status(409)
        .json({ code: error.code, message: error.message });
    }
    return next(error);
  }
};

export const reactivate = async (request, response, next) => {
  try {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success)
      return response
        .status(400)
        .json({ message: "Revisa el correo y la contraseña." });
    await reactivateUser(parsed.data.email, parsed.data.password);
    return response.sendStatus(204);
  } catch (error) {
    return next(error);
  }
};

export const confirmEmailController = async (request, response, next) => {
  try {
    const parsed = emailConfirmationTokenSchema.safeParse(request.body);
    if (!parsed.success) {
      return response
        .status(410)
        .json({ message: "El enlace de confirmación no es válido." });
    }
    await confirmEmail(parsed.data.token);
    return response.json({
      message: "Correo confirmado. Ya puedes iniciar sesión.",
    });
  } catch (error) {
    return next(error);
  }
};

export const resendEmailConfirmationController = async (
  request,
  response,
) => {
  const parsed = passwordResetRequestSchema.safeParse(request.body);
  if (parsed.success) {
    try {
      await resendEmailConfirmation(parsed.data.email);
    } catch (error) {
      console.error(
        "No fue posible reenviar el correo de confirmación:",
        error.message,
      );
    }
  }
  return response.status(200).json({
    message:
      "Si la cuenta necesita confirmación, enviaremos un nuevo enlace a ese correo.",
  });
};

export const login = async (request, response, next) => {
  try {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({
        message: "Los datos de inicio de sesión no son válidos.",
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

export const requestPasswordResetController = async (
  request,
  response,
  next,
) => {
  try {
    const parsed = passwordResetRequestSchema.safeParse(request.body);
    if (parsed.success) {
      await requestPasswordReset(parsed.data.email, parsed.data.reactivate);
    }
  } catch (error) {
    console.error(
      "No fue posible procesar la solicitud de restablecimiento:",
      error.message,
    );
  }
  return response.status(200).json({
    message:
      "Si existe una cuenta con este correo, se te enviará un enlace para restablecer la contraseña.",
  });
};

export const validatePasswordResetController = async (
  request,
  response,
  next,
) => {
  try {
    const parsed = passwordResetTokenSchema.safeParse(request.query);
    if (!parsed.success) {
      return response
        .status(410)
        .json({ message: "El enlace de restablecimiento no es válido." });
    }
    await validatePasswordResetToken(parsed.data.token);
    return response.json({ valid: true });
  } catch (error) {
    return next(error);
  }
};

export const cancelPasswordResetController = async (
  request,
  response,
  next,
) => {
  try {
    const parsed = passwordResetTokenSchema.safeParse(request.body);
    if (parsed.success) await cancelPasswordResetToken(parsed.data.token);
    return response.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export const resetPasswordController = async (request, response, next) => {
  try {
    const parsed = passwordResetSchema.safeParse(request.body);
    if (!parsed.success) {
      return response
        .status(400)
        .json({ message: "Ingresa una contraseña válida." });
    }
    await resetPassword(parsed.data.token, parsed.data.password);
    return response.json({ message: "Contraseña restablecida correctamente." });
  } catch (error) {
    return next(error);
  }
};
