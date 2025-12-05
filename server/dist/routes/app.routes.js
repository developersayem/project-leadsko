"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app_controller_1 = require("../controller/app.controller");
const router = express_1.default.Router();
router.get("/folders-with-leads", app_controller_1.getAllFoldersWithLeads);
router.get("/folders-with-subfolders", app_controller_1.getFoldersWithCounts);
// GET → Fetch latest marquee
router.get("/marquee", app_controller_1.getMarquee);
router.get("/:folderId/files", app_controller_1.getFolderWithFiles);
// PUT → Update a marquee by ID
router.put("/marquee/:id", app_controller_1.updateMarquee);
exports.default = router;
