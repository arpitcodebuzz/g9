import { Router } from "express";
const routes = Router();
import knex from "../../common/config/database.config";
import productsController from "../products/products.controller";
import productDto from "../products/dto/product.dto";
import validator from "../../common/config/joi-validator";
import adminAuthentication from "../../common/middleware/admin-authentication.middleware";
import asyncWrap from "express-async-wrapper";
import upload from "../../common/helpers/multer";
import {
  getAllMedia,
  deleteFromS3,
} from "../../common/config/awsBucket.config";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

routes.post(
  "/add",
  adminAuthentication,
  validator.body(productDto),
  asyncWrap(productsController.add)
);

routes.post(
  "/add-media",
  upload.fields([
    { name: "images", maxCount: 20 },
    { name: "video", maxCount: 1 },
  ]),
  productsController.addMedia
);

// routes.delete('/deleteImage', productsController.deleteImage);

routes.delete("/deleteMedia", productsController.deleteMedia);

routes.get("/list", adminAuthentication, asyncWrap(productsController.list));
routes.get(
  "/detail/:id",
  adminAuthentication,
  asyncWrap(productsController.detail)
);
routes.delete(
  "/delete/:id",
  adminAuthentication,
  asyncWrap(productsController.delete)
);

routes.post(
  "/edit/:id",
  adminAuthentication,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "video", maxCount: 1 },
  ]),
  asyncWrap(productsController.edit)
);

routes.post(
  "/addtopSelling/:id",
  adminAuthentication,
  asyncWrap(productsController.addtopSelling)
);
routes.post(
  "/removetopSelling/:id",
  adminAuthentication,
  asyncWrap(productsController.removetopSelling)
);

routes.post(
  "/addCsv",
  adminAuthentication,
  upload.fields([{ name: "file", maxCount: 1 }]),
  asyncWrap(productsController.addCsv)
);

routes.get(
  "/gold-price",
  adminAuthentication,
  asyncWrap(productsController.goldPrice)
);

routes.get("/convert", async (req, res) => {
  try {
    // const folderPath = path.join(
    //   __dirname,
    //   "../../../public",
    //   "uploads",
    //   "productmedia"
    // );
    // console.log(folderPath);

    // const data = await getAllMedia();

    // for (let i = 0; i < data.length; i++) {
    //   const element = data[i];

    //   const fileName = element.key.split("/").pop();
    //   // console.log(fileName);

    //   const proImage = await knex("product_images")
    //     .where({ image: fileName })
    //     .first();

    //   if (proImage) {
    //     console.log("exist ------------------", fileName);
    //     const filePath = path.join(folderPath, fileName);
    //     const fileExists = fs.existsSync(filePath);

    //     if (fileExists) {
    //       console.log("File Exists:", fileExists);
    //       const inputFile = fileName;
    //       const outputFile = fileName.replace(/\.[^/.]+$/, ".webp");
    //       const input = path.join(
    //         "public",
    //         "uploads",
    //         "productmedia",
    //         inputFile
    //       );
    //       const output = path.join(
    //         "public",
    //         "uploads",
    //         "productmedia",
    //         outputFile
    //       );
    //       const command = `"C:\\webp\\bin\\cwebp.exe" "${input}" -q 80 -o "${output}"`;
    //       await new Promise((resolve, reject) => {
    //         exec(command, (err, stdout, stderr) => {
    //           if (err) {
    //             console.error("❌ Error converting:", stderr || err.message);
    //             return reject(err);
    //           }

    //           console.log("✔ Converted:", outputFile);
    //           fs.unlink(input, (err) => {
    //             if (err) {
    //               console.error(
    //                 "⚠️ Failed to delete old file:",
    //                 input,
    //                 err.message
    //               );
    //             } else {
    //               console.log("🗑️ Deleted old file:", inputFile);
    //             }
    //           });
    //           deleteFromS3(inputFile)
    //           resolve(stdout);
    //         });
    //       });
    //       const s3Key = output;
    //       console.log(path.join(s3Key));

    //       const fileStream = fs.createReadStream(s3Key);

    //       const upload = new Upload({
    //         client: s3,
    //         params: {
    //           Bucket: process.env.AWS_BUCKET,
    //           Key: s3Key,
    //           Body: fileStream,
    //           ContentType: "image/webp",
    //           // ACL: "public-read" // ❌ remove if bucket is private
    //         },
    //       });

    //       const result = await upload.done();
    //       console.log("UPLOAD DONE:", result);
    //     } else {
    //       console.log("File missing on local:", fileExists);
    //       deleteFromS3(element.key)
    //     }
    //   } else {
    //     console.log("not exist ------------------", fileName);
    //     deleteFromS3(element.key)
    //   }
    // }

    // console.log(data)

    const folderPath = path.join(
      __dirname,
      "../../../public",
      "uploads",
      "productmedia"
    );

    // console.log("Folder:", folderPath);

    const data = await getAllMedia();

    // for (let i = 0; i < data.length; i++) {
    //   const element = data[i];
    //   const fileName = element.key.split("/").pop();

    //   const proImage = await knex("product_images")
    //     .where({ image: fileName })
    //     .first();

    //   // =========================
    //   // CASE 1: NOT IN DATABASE
    //   // =========================
    //   if (!proImage) {
    //     console.log("not exist ------------------", fileName);
    //     deleteFromS3(element.key);
    //     continue;
    //   }

    //   console.log("exist ------------------", fileName);

    //   const filePath = path.join(folderPath, fileName);
    //   const fileExists = fs.existsSync(filePath);

    //   // =========================
    //   // CASE 2: LOCAL FILE MISSING
    //   // =========================
    //   if (!fileExists) {
    //     console.log("File missing on local:", fileName);
    //     deleteFromS3(element.key);
    //     continue;
    //   }

    //   // =========================
    //   // Convert to WEBP
    //   // =========================
    //   const outputFile = fileName.replace(/\.[^/.]+$/, ".webp");

    //   const input = path.join(folderPath, fileName);
    //   const output = path.join(folderPath, outputFile);

    //   // Correct Windows command
    //   const command = `cwebp "${input}" -q 80 -o "${output}"`;

    //   try {
    //     await new Promise((resolve, reject) => {
    //       exec(command, (err, stdout, stderr) => {
    //         if (err) {
    //           console.error("❌ Error converting:", stderr || err.message);
    //           return reject(err);
    //         }

    //         console.log("✔ Converted:", outputFile);
    //         resolve(stdout);
    //       });
    //     });
    //   } catch (err) {
    //     continue;
    //   }

    //   // =========================
    //   // Delete old file safely
    //   // =========================
    //   try {
    //     await fs.promises.unlink(input);
    //     console.log("🗑️ Deleted old file:", fileName);
    //   } catch (err) {
    //     console.log("⚠️ Failed to delete:", fileName, err.message);
    //   }

    //   // Delete old image from S3
    //   deleteFromS3(element.key);

    //   // =========================
    //   // Upload to S3
    //   // =========================
    //   const s3Key = `public/uploads/productmedia/${outputFile}`;
    //   const fileStream = fs.createReadStream(output);

    //   const upload = new Upload({
    //     client: s3,
    //     params: {
    //       Bucket: process.env.AWS_BUCKET,
    //       Key: s3Key,
    //       Body: fileStream,
    //       ContentType: "image/webp",
    //     },
    //   });

    //   const result = await upload.done();
    //   console.log("UPLOAD DONE:", result);
    //   await knex("product_images")
    //     .where({ image: fileName })
    //     .update({ image: outputFile });
    // }

    return res.send({
      status: true,
      data: data,
    });
  } catch (error) {
    console.log(error);
    return res.send({
      status: false,
      message: "Something went wrong..",
    });
  }
});

export default routes;
