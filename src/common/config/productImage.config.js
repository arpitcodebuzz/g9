import axios from "axios";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { deleteFromS3 } from "./awsBucket.config"
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";


const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  }
});

const folderMap = {
  images: { input: "productBaseImage", output: "productmedia" },
  blogImage: { input: "blogsBaseImage", output: "blogs" },
  slider: { input: "sliderBaseImage", output: "slider" },
  profile: { input: "profileBaseImage", output: "profile" },
  mediaImage: { input: "mediaBaseImage", output: "media" },
  certificate: { input: "certificateBaseImage", output: "certificate" },
  logo: { input: "certificateBaseImage", output: "logo" },
  festival: { input: "festivalBaseImage", output: "festival" },
  exploreImg: { input: "exploreImgBaseImage", output: "exploreImg" },
  newArrival: { input: "newArrivalBaseImage", output: "newArrival" },
};

export const converter = async (files) => {
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!folderMap[file.fieldname]) continue; // skip unlisted fields

      const inputFolder = folderMap[file.fieldname].input;
      const outputFolder = folderMap[file.fieldname].output;

      const inputFile = file.filename;
      const outputFile = inputFile.replace(/\.[^/.]+$/, ".webp");
      file.filename = outputFile;

      const inputPath = path.join("public/uploads", inputFolder, inputFile);
      // const outputPath = path.join("public/uploads", outputFolder, outputFile);
      //path.join("public", "uploads", "productmedia", outputFile);
      const outputPath = path.join("public", "uploads", outputFolder, outputFile);

      // Ensure output folder exists
      if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      }

      const command = `"C:\\webp\\bin\\cwebp.exe" "${inputPath}" -q 80 -o "${outputPath}"`;

      await new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
          if (err) return reject(err);

          fs.unlink(inputPath, (err) => {
            if (err) console.error("⚠️ Failed to delete:", inputPath, err.message);
            else console.log("🗑️ Deleted:", inputPath);
          });

          resolve(stdout);
        });
      });

      // Upload to S3
      // const fileStream = fs.createReadStream(outputPath);
      // const upload = new Upload({
      //   client: s3,
      //   params: {
      //     Bucket: process.env.AWS_BUCKET,
      //     Key: outputPath,
      //     Body: fileStream,
      //     ContentType: "image/webp",
      //   },
      // });

      // const result = await upload.done();
      // console.log("✔ Uploaded:", result);
      // Relative path inside S3 bucket
      const s3Key = path.join("public", "uploads", outputFolder, outputFile).replace(/\\/g, "/"); // use forward slashes for S3

      const fileStream = fs.createReadStream(outputPath);

      const upload = new Upload({
        client: s3,
        params: {
          Bucket: process.env.AWS_BUCKET,
          Key: s3Key,        // <-- use relative path, not local path
          Body: fileStream,
          ContentType: "image/webp",
        },
      });

      const result = await upload.done();
      console.log("✔ Uploaded:", result);

    }

    return files;
  } catch (error) {
    console.error("CONVERT ERROR:", error);
    return false;
  }
};


// export const converter = async (files) => {
//   try {

//     // console.log(files)

//     let imageArray = []

//     for (let i = 0; i < files.length; i++) {
//       const element = files[i];

//       const inputFile = element.filename;
//       const outputFile = inputFile.replace(/\.[^/.]+$/, ".webp");
//       element.filename = outputFile
//       // imageArray.push({filename=})

//       const input = path.join("public", "uploads", "productBaseImage", inputFile);
//       // console.log(input)
//       element.path = input
//       const output = path.join("public", "uploads", "productmedia", outputFile);

//       const command = `"C:\\webp\\bin\\cwebp.exe" "${input}" -q 80 -o "${output}"`;

//       // console.log("Running:", command);

//       await new Promise((resolve, reject) => {
//         exec(command, (err, stdout, stderr) => {
//           if (err) {
//             console.error("❌ Error converting:", stderr || err.message);
//             return reject(err);
//           }

//           // console.log("✔ Converted:", outputFile);
//           fs.unlink(input, (err) => {
//             if (err) {
//               console.error("⚠️ Failed to delete old file:", input, err.message);
//             } else {
//               console.log("🗑️ Deleted old file:", inputFile);
//             }
//           });
//           // deleteFromS3(inputFile)
//           resolve(stdout);
//         });
//       });

//       const s3Key = output;
//       // console.log(path.join(s3Key))

//       const fileStream = fs.createReadStream(s3Key);

//       const upload = new Upload({
//         client: s3,
//         params: {
//           Bucket: process.env.AWS_BUCKET,
//           Key: s3Key,
//           Body: fileStream,
//           ContentType: 'image/webp',
//           // ACL: "public-read" // ❌ remove if bucket is private
//         }
//       });

//       const result = await upload.done();
//       // console.log("UPLOAD DONE:", result);

//     }


//     return files;

//   } catch (error) {
//     console.log("CONVERT ERROR:", error);
//     // throw error;
//     return false;
//   }
// };

