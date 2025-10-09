import { Elysia } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { cors } from "@elysiajs/cors";

import { authRoutes, protectedAuthRoutes } from "./api/routes/auth";
import { adminRoutes } from "./api/routes/admin";
import { userRoutes } from "./api/routes/users";
import { teamRoutes } from "./api/routes/teams";
import { groupRoutes } from "./api/routes/groups";
import { roleRoutes } from "./api/routes/roles";
import { vaultRoutes } from "./api/routes/vault";
import { financialsRoutes } from "./api/routes/financials";
import { reportingRoutes } from "./api/routes/reporting";

const app = new Elysia()
  .use(cookie())
  .use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    })
  )
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  .use(authRoutes)
  .use(protectedAuthRoutes)
  .use(adminRoutes)
  .use(userRoutes)
  .use(teamRoutes)
  .use(groupRoutes)
  .use(roleRoutes)
  .use(vaultRoutes)
  .use(financialsRoutes)
  .use(reportingRoutes)
  .onError(({ error, set }: { error: unknown; set: any }) => {
    console.error("Error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (!set.status || set.status === 200) {
      if (errorMessage.includes("Unauthorized")) {
        set.status = 401;
      } else if (errorMessage.includes("Forbidden")) {
        set.status = 403;
      } else if (errorMessage.includes("not found")) {
        set.status = 404;
      } else if (errorMessage.includes("already exists")) {
        set.status = 409;
      } else {
        set.status = 500;
      }
    }

    return { error: errorMessage };
  })
  .listen(process.env.PORT || 3000);

console.log(
  ` Server running at http://${app.server?.hostname}:${app.server?.port}`
);
console.log(
  `Health: http://${app.server?.hostname}:${app.server?.port}/health`
);
console.log(` Auth: /auth/*`);
console.log(` Users: /users/*`);
console.log(` Teams: /teams/*`);
console.log(` Groups: /groups/*`);
console.log(` Roles: /roles/*`);
console.log(`Vault: /vault/*`);
