"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFolder = exports.editFolder = exports.createFolder = exports.getFolders = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const folder_model_1 = require("../models/folder.model");
const file_model_1 = require("../models/file.model");
/**
 * @desc Get all folders (optionally nested)
 */
exports.getFolders = (0, asyncHandler_1.default)(async (req, res) => {
    const folders = await folder_model_1.Folder.find().populate("files");
    if (!folders || folders.length === 0) {
        throw new ApiError_1.ApiError(404, "No folders found");
    }
    res.status(200).json(new ApiResponse_1.ApiResponse(200, folders, "Folders fetched successfully"));
});
/**
 * @desc Create new folder (can be root or subfolder)
 */
exports.createFolder = (0, asyncHandler_1.default)(async (req, res) => {
    const { name, parentFolder } = req.body;
    console.log("req.body:", req.body);
    console.log("parentFolder:", parentFolder);
    if (!name?.trim())
        throw new ApiError_1.ApiError(400, "Folder name is required");
    // Optional: ensure unique name within the same parent
    const exists = await folder_model_1.Folder.findOne({ name, parentFolder: parentFolder || null });
    if (exists)
        throw new ApiError_1.ApiError(400, "Folder with this name already exists in the parent folder");
    const folder = await folder_model_1.Folder.create({
        name: name.trim(),
        parentFolder: parentFolder || null,
        files: [],
    });
    console.log(exists);
    res.status(201).json(new ApiResponse_1.ApiResponse(201, "folder", "Folder created successfully"));
});
/**
 * @desc Edit folder name
 */
exports.editFolder = (0, asyncHandler_1.default)(async (req, res) => {
    const folderId = req.params.id;
    const { name } = req.body;
    if (!folderId)
        throw new ApiError_1.ApiError(400, "Folder ID is required");
    if (!name?.trim())
        throw new ApiError_1.ApiError(400, "Folder name is required");
    const updated = await folder_model_1.Folder.findByIdAndUpdate(folderId, { name: name.trim() }, { new: true });
    if (!updated)
        throw new ApiError_1.ApiError(404, "Folder not found");
    res.status(200).json(new ApiResponse_1.ApiResponse(200, updated, "Folder updated successfully"));
});
/**
 * @desc Delete folder (and its files + subfolders recursively)
 */
exports.deleteFolder = (0, asyncHandler_1.default)(async (req, res) => {
    const folderId = req.params.id;
    if (!folderId)
        throw new ApiError_1.ApiError(400, "Folder ID is required");
    const folder = await folder_model_1.Folder.findById(folderId);
    if (!folder)
        throw new ApiError_1.ApiError(404, "Folder not found");
    // Recursive delete of subfolders
    async function deleteSubfolders(parentId) {
        const subfolders = await folder_model_1.Folder.find({ parentFolder: parentId });
        for (const sub of subfolders) {
            await file_model_1.File.deleteMany({ folder: sub._id });
            await deleteSubfolders(sub._id);
            await folder_model_1.Folder.findByIdAndDelete(sub._id);
        }
    }
    await file_model_1.File.deleteMany({ folder: folder._id }); // delete files inside this folder
    await deleteSubfolders(folder._id);
    await folder_model_1.Folder.findByIdAndDelete(folder._id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, null, "Folder and its contents deleted successfully"));
});
