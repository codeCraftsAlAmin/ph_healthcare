import { IRequestUserInterface } from "../interface/requestUserInterface";

declare global {
  namespace Express {
    interface Request {
      user?: IRequestUserInterface;
    }
  }
}
