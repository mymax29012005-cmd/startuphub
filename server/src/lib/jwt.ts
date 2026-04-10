import jwt from "jsonwebtoken";
import { env } from "./config";

export type JwtPayload = {
  userId: string;
  role: "user" | "admin";
  accountType: "founder" | "investor" | "partner" | "buyer";
};

export function signJwt(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "30d" });
}

export function verifyJwt(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

