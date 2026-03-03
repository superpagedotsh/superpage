import "express";

declare module "express-serve-static-core" {
  interface Request {
    payment?: {
      proof: any;
      verified: boolean;
      amount: string;
      token: string;
    };
  }
}
