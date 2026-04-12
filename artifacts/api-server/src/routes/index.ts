import { Router, type IRouter } from "express";
import healthRouter from "./health.js";

const router: any = Router();

router.use(healthRouter);

export default router;
