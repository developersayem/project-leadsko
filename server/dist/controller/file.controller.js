"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.editFile = exports.createFile = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const file_model_1 = require("../models/file.model");
const folder_model_1 = require("../models/folder.model");
/**
 * @desc Create a file inside a folder
 */
exports.createFile = (0, asyncHandler_1.default)(async (req, res) => {
    const { name, price, numbers, currency, folder, icon } = req.body;
    console.log(req.body);
    if (!name?.trim())
        throw new ApiError_1.ApiError(400, "File name is required");
    if (price === undefined || price === null)
        throw new ApiError_1.ApiError(400, "File price is required");
    if (!numbers && numbers !== 0)
        throw new ApiError_1.ApiError(400, "Numbers are required");
    if (!currency?.trim())
        throw new ApiError_1.ApiError(400, "Currency is required");
    if (!folder)
        throw new ApiError_1.ApiError(400, "Folder ID is required");
    if (!icon?.trim())
        throw new ApiError_1.ApiError(400, "File type/icon is required");
    const folderExists = await folder_model_1.Folder.findById(folder);
    if (!folderExists)
        throw new ApiError_1.ApiError(400, "Folder does not exist");
    // Prevent duplicates in same folder
    const exists = await file_model_1.File.findOne({ name: name.trim(), folder });
    if (exists)
        throw new ApiError_1.ApiError(400, "File with this name already exists in the folder");
    const file = await file_model_1.File.create({
        name: name.trim(),
        folder,
        price: price.toString(), // Store as string to match schema
        numbers,
        currency,
        icon,
    });
    await folder_model_1.Folder.findByIdAndUpdate(folder, { $push: { files: file._id } });
    res.status(201).json(new ApiResponse_1.ApiResponse(201, file, "File created successfully"));
});
/**
 * @desc Edit file details
 */
exports.editFile = (0, asyncHandler_1.default)(async (req, res) => {
    const fileId = req.params.id;
    const { name, price, numbers, currency, icon } = req.body;
    if (!fileId)
        throw new ApiError_1.ApiError(400, "File ID is required");
    if (!name?.trim())
        throw new ApiError_1.ApiError(400, "File name is required");
    if (price === undefined || price === null)
        throw new ApiError_1.ApiError(400, "File price is required");
    if (!numbers && numbers !== 0)
        throw new ApiError_1.ApiError(400, "Numbers are required");
    if (!currency?.trim())
        throw new ApiError_1.ApiError(400, "Currency is required");
    if (!icon?.trim())
        throw new ApiError_1.ApiError(400, "File type/icon is required");
    const updated = await file_model_1.File.findByIdAndUpdate(fileId, {
        name: name.trim(),
        price: price.toString(),
        numbers,
        currency,
        icon,
    }, { new: true });
    if (!updated)
        throw new ApiError_1.ApiError(404, "File not found");
    res.status(200).json(new ApiResponse_1.ApiResponse(200, updated, "File updated successfully"));
});
/**
 * @desc Delete a file
 */
exports.deleteFile = (0, asyncHandler_1.default)(async (req, res) => {
    const fileId = req.params.id;
    if (!fileId)
        throw new ApiError_1.ApiError(400, "File ID is required");
    const file = await file_model_1.File.findById(fileId);
    if (!file)
        throw new ApiError_1.ApiError(404, "File not found");
    await folder_model_1.Folder.findByIdAndUpdate(file.folder, { $pull: { files: file._id } });
    await file_model_1.File.findByIdAndDelete(file._id);
    res.status(200).json(new ApiResponse_1.ApiResponse(200, null, "File deleted successfully"));
});
