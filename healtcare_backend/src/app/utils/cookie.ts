import { CookieOptions, Request, Response } from "express";

// set cookie
const setCookie = (
  res: Response,
  key: string,
  value: string,
  options: CookieOptions,
) => {
  res.cookie(key, value, options);
};

// get cookie
const getCookie = (req: Request, key: string) => {
  return req.cookies?.[key];
};

// clear cookie
const clearCookies = (res: Response, key: string, options: CookieOptions) => {
  res.clearCookie(key, options);
};

const cookieUtils = {
  setCookie,
  getCookie,
  clearCookies,
};

export default cookieUtils;
