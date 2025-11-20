// types/express/index.d.ts
import { IUserDocument } from "@/models/user";

declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument | null;
      params: { videoId: string };
    }
  }
}
