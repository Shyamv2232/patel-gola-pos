import express from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app: any = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);
app.use("/", router);

app.get("/", (_req: any, res: any) => {
  res.json({ message: "Patel Gola POS API Server is running" });
});

// Catch-all to help debug 404s
app.use((req: any, res: any) => {
  console.log(`404 at path: ${req.url}`);
  res.status(404).json({ error: "Not Found", path: req.url });
});

export default app;
