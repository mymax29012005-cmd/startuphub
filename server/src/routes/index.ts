import { Router } from "express";

import { authRouter } from "./v1/auth";
import { statsRouter } from "./v1/stats";
import { startupsRouter } from "./v1/startups";
import { ideasRouter } from "./v1/ideas";
import { auctionsRouter } from "./v1/auctions";
import { investorsRouter } from "./v1/investors";
import { partnersRouter } from "./v1/partners";
import { favoritesRouter } from "./v1/favorites";
import { startupAnalysisRouter } from "./v1/startupAnalysis";
import { usersRouter } from "./v1/users";
import { chatsRouter } from "./v1/chats";
import { uploadsRouter } from "./v1/uploads";
import { moderationRouter } from "./v1/moderation";
import { notificationsRouter } from "./v1/notifications";

export const apiV1Router = Router();

apiV1Router.use("/auth", authRouter);
apiV1Router.use("/chats", chatsRouter);
apiV1Router.use("/users", usersRouter);
apiV1Router.use("/stats", statsRouter);
apiV1Router.use("/startups", startupsRouter);
apiV1Router.use("/ideas", ideasRouter);
apiV1Router.use("/auctions", auctionsRouter);
apiV1Router.use("/investors", investorsRouter);
apiV1Router.use("/partners", partnersRouter);
apiV1Router.use("/favorites", favoritesRouter);
apiV1Router.use("/startup-analysis", startupAnalysisRouter);
apiV1Router.use("/uploads", uploadsRouter);
apiV1Router.use("/moderation", moderationRouter);
apiV1Router.use("/notifications", notificationsRouter);

