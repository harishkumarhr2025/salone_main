import express from "express";
const router = express.Router();
import { AuthMiddleware, authorizeRoles } from "../middlewares/AuthMiddleware.js";

import { createAgent, getAllAgents, previewAgentsImport, importAgents } from "../controllers/AgentController.js";

router.route("/create-new-agent").post(createAgent);
router.route("/get-all-agent").get(AuthMiddleware, authorizeRoles("admin"), getAllAgents);
router.route("/agents/import-preview").post(AuthMiddleware, authorizeRoles("admin"), previewAgentsImport);
router.route("/agents/import").post(AuthMiddleware, authorizeRoles("admin"), importAgents);
router.route("/fetch-agent-by-id/:agentId").get();
router.route("/update-agent/:agentId").patch(AuthMiddleware, authorizeRoles("admin"));
router.route("/agents/:agentId/checkout").patch(AuthMiddleware, authorizeRoles("admin"));
export default router;
