"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadFile = void 0;
const https_1 = require("https");
const fs_1 = require("fs");
const downloadFile = (url, fileName) => __awaiter(void 0, void 0, void 0, function* () {
    yield new Promise((resolve, reject) => {
        (0, https_1.get)(url, res => res.pipe((0, fs_1.createWriteStream)(fileName).on('finish', () => resolve('Finished downlaod'))
            .on('error', (err) => reject(err))));
    });
});
exports.downloadFile = downloadFile;
