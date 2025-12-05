"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMarquee = exports.getMarquee = exports.getAllFoldersWithLeads = exports.getFoldersWithCounts = exports.getFolderWithFiles = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const folder_model_1 = require("../models/folder.model");
const file_model_1 = require("../models/file.model");
const model_1 = require("../models/model");
/**
 * GET /api/folder/:folderId
 * Fetch a specific folder with all files inside, including total leads.
 */
const getFolderLeads = async (folderId) => {
    const files = await file_model_1.File.find({ folder: folderId }).lean();
    const subfolders = await folder_model_1.Folder.find({ parentFolder: folderId }).lean();
    const subfolderLeads = await Promise.all(subfolders.map((sub) => getFolderLeads(sub._id)));
    const totalLeads = files.reduce((sum, f) => sum + (f.numbers || 0), 0) +
        subfolderLeads.reduce((sum, l) => sum + l, 0);
    return totalLeads;
};
exports.getFolderWithFiles = (0, asyncHandler_1.default)(async (req, res) => {
    const { folderId } = req.params;
    if (!folderId)
        throw new ApiError_1.ApiError(400, "Folder ID is required");
    const folder = await folder_model_1.Folder.findById(folderId).lean();
    if (!folder)
        throw new ApiError_1.ApiError(404, "Folder not found");
    const files = await file_model_1.File.find({ folder: folder._id }).lean();
    const totalLeads = await getFolderLeads(folder._id);
    const responseData = {
        _id: folder._id,
        name: folder.name,
        leads: totalLeads,
        files: files.map((f) => ({
            _id: f._id,
            name: f.name,
            price: Number(f.price),
            numbers: f.numbers,
            currency: f.currency,
            icon: f.icon,
        })),
    };
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, responseData, "Folder and files fetched successfully"));
});
exports.getFoldersWithCounts = (0, asyncHandler_1.default)(async (req, res) => {
    // Fetch root folders sorted A → Z by name
    const rootFolders = await folder_model_1.Folder.find({ parentFolder: null }).sort({ name: 1 });
    // Define recursive function
    const getFolderDetails = async (folder) => {
        const files = await file_model_1.File.find({ folder: folder._id });
        // Sort subfolders A → Z
        const subfolders = await folder_model_1.Folder.find({ parentFolder: folder._id }).sort({ name: 1 });
        const subfolderDetails = await Promise.all(subfolders.map((sub) => getFolderDetails(sub)));
        const hasSubfolders = subfolders.length > 0;
        const totalLeads = hasSubfolders
            ? subfolderDetails.reduce((sum, sub) => sum + sub.totalLeads, 0)
            : files.reduce((sum, f) => sum + (f.numbers || 0), 0);
        const fileCount = hasSubfolders ? 0 : files.length;
        const subfolderCount = subfolders.length;
        const countType = hasSubfolders ? "folders" : "files";
        const displayCount = hasSubfolders ? subfolderCount : files.length;
        return {
            _id: folder._id,
            name: folder.name,
            files: files.map((f) => f._id),
            totalLeads,
            fileCount,
            subfolderCount,
            subfolders: subfolderDetails,
            displayCount,
            countType,
        };
    };
    // Build the tree
    let data = await Promise.all(rootFolders.map((f) => getFolderDetails(f)));
    // Move specific folders to the end by ID
    const lastFolderIds = [
        "68f88e9431973907ce15c7a6", // ALL BANGLADESH 64 DISTRICT
        "68f89b7155fe957f4037318c", // international leads
    ];
    // Sort data again: move specific IDs to bottom
    data = data.sort((a, b) => {
        const aIsLast = lastFolderIds.includes(String(a._id));
        const bIsLast = lastFolderIds.includes(String(b._id));
        if (aIsLast && !bIsLast)
            return 1;
        if (!aIsLast && bIsLast)
            return -1;
        return a.name.localeCompare(b.name);
    });
    res.status(200).json({
        statusCode: 200,
        data,
        message: "Folders with dynamic file/folder counts fetched successfully",
        success: true,
    });
});
/**
 * GET /api/folders
 * Fetch all folders with total lead counts (aggregated)
 */
exports.getAllFoldersWithLeads = (0, asyncHandler_1.default)(async (req, res) => {
    const folders = await folder_model_1.Folder.aggregate([
        {
            $lookup: {
                from: "files",
                localField: "_id",
                foreignField: "folder",
                as: "files",
            },
        },
        {
            $addFields: {
                leads: {
                    $sum: {
                        $map: {
                            input: "$files",
                            as: "file",
                            in: { $ifNull: ["$$file.numbers", 0] },
                        },
                    },
                },
                fileCount: { $size: "$files" },
            },
        },
        {
            $project: {
                name: 1,
                leads: 1,
                fileCount: 1,
            },
        },
    ]);
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, folders, "Folders with leads retrieved successfully"));
});
/**
 * GET /api/marquee
 * Fetch the latest marquee document
 */
exports.getMarquee = (0, asyncHandler_1.default)(async (req, res) => {
    const marquee = await model_1.Marquee.findOne().sort({ createdAt: -1 }).lean();
    if (!marquee)
        throw new ApiError_1.ApiError(404, "No marquee found");
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, marquee, "Latest marquee fetched successfully"));
});
/**
 * PUT /api/marquee/:id
 * Update marquee text and colors
 */
exports.updateMarquee = (0, asyncHandler_1.default)(async (req, res) => {
    const { id } = req.params;
    const { text, bgColor, color } = req.body;
    if (!id)
        throw new ApiError_1.ApiError(400, "Marquee ID is required");
    const updated = await model_1.Marquee.findByIdAndUpdate(id, { text, bgColor, color }, { new: true, runValidators: true }).lean();
    if (!updated)
        throw new ApiError_1.ApiError(404, "Marquee not found");
    return res
        .status(200)
        .json(new ApiResponse_1.ApiResponse(200, updated, "Marquee updated successfully"));
});
