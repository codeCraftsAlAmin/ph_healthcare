import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

const createToken = (
  payload: JwtPayload,
  secret: string,
  { expiresIn }: SignOptions,
) => {
  const token = jwt.sign(payload, secret, { expiresIn });
  return token;
};

const verifyToken = (token: string, secret: string) => {
  try {
    const decoded = jwt.verify(token, secret);
    return {
      ok: true,
      data: decoded,
    };
  } catch (error: any) {
    return {
      ok: false,
      message: error.message,
      error,
    };
  }
};

const decodeToken = (token: string) => {
  const decoded = jwt.decode(token);
  return decoded;
};

export const jwtUtils = {
  createToken,
  verifyToken,
  decodeToken,
};
