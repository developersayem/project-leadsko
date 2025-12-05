"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const loggerMiddleware_1 = require("./middlewares/loggerMiddleware");
const error_middlewares_1 = require("./middlewares/error.middlewares");
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
exports.app = app;
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        callback(null, origin || "*"); // Reflect the requesting origin
    },
    credentials: true,
}));
// set trust proxy
app.set("trust proxy", 1);
// Parse JSON and URL-encoded bodies for routes NOT expecting multipart/form-data
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// Parse cookies
app.use((0, cookie_parser_1.default)());
// Serve files in public folder
app.use("/public", express_1.default.static(path_1.default.join(process.cwd(), "public")));
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
// Use custom logger middleware early
app.use(loggerMiddleware_1.loggerMiddleware);
// Import routes
const folder_routes_1 = __importDefault(require("./routes/folder.routes"));
const file_routes_1 = __importDefault(require("./routes/file.routes"));
const app_routes_1 = __importDefault(require("./routes/app.routes"));
const unit_price_routes_1 = __importDefault(require("./routes/unit.price.routes"));
const authentication_routes_1 = __importDefault(require("./routes/authentication.routes"));
// Use routes
app.use("/api/v1/folders", folder_routes_1.default);
app.use("/api/v1/files", file_routes_1.default);
app.use("/api/v1/app", app_routes_1.default);
app.use("/api/v1/unit-price", unit_price_routes_1.default);
app.use("/api/v1/auth", authentication_routes_1.default);
// custom error middlewares
app.use(error_middlewares_1.errorHandler);
