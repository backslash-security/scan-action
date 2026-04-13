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
const child_process_1 = require("child_process");
/**
 * Downloads a file from S3 using the AWS CLI, which automatically picks up
 * the EC2 instance-role credentials on self-hosted runners.
 * Converts path-style HTTPS URLs (https://s3.amazonaws.com/bucket/key)
 * to s3://bucket/key URIs.
 */
const downloadFile = (url, fileName) => __awaiter(void 0, void 0, void 0, function* () {
    const s3Uri = url.replace(/^https:\/\/s3\.amazonaws\.com\//, 's3://');
    yield new Promise((resolve, reject) => {
        var _a, _b;
        const child = (0, child_process_1.spawn)('aws', ['s3', 'cp', s3Uri, fileName], {
            stdio: ['inherit', 'pipe', 'pipe'],
        });
        (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (d) => process.stdout.write(d));
        (_b = child.stderr) === null || _b === void 0 ? void 0 : _b.on('data', (d) => process.stderr.write(d));
        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`aws s3 cp failed with exit code ${code} for ${s3Uri}`));
            }
            else {
                resolve();
            }
        });
        child.on('error', reject);
    });
});
exports.downloadFile = downloadFile;
