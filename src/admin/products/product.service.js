import knex from "../../common/config/database.config";
import fs from "fs";
import path from "path";
import axios from "axios";
import { uploadToS3, deleteFromS3 } from "../../common/config/awsBucket.config";
import { converter } from "../../common/config/productImage.config";
import csvtojson from "csvtojson";

class productService {
  async add(body) {
    try {
      const {
        categoryId,
        subCategoryId,
        title,
        description,
        stockNumber,
        original_price,
        selling_price,
        stoneShapeId,
        productMaterials,
        estimatedTime,
        topSelling,
        discounted,
        readyToShip,
        newArrival,
        shortDescription,
        purity,
        metals,
        diamondCut,
      } = body;

      const existingProduct = await knex("products")
        .where(function () {
          this.where("stockNumber", stockNumber);
        })
        .first();

      if (existingProduct)
        return {
          status: false,
          message: "Product with the same stock number already exists !!",
        };

      const topSellingBool =
        topSelling == true ||
          topSelling == "true" ||
          topSelling == 1 ||
          topSelling == "1"
          ? 1
          : 0;
      const discountedBool =
        discounted == true ||
          discounted == "true" ||
          discounted == 1 ||
          discounted == "1"
          ? 1
          : 0;
      const readyToShipBool =
        readyToShip == true ||
          readyToShip == "true" ||
          readyToShip == 1 ||
          readyToShip == "1"
          ? 1
          : 0;
      const newArrivalBool =
        newArrival == true ||
          newArrival == "true" ||
          newArrival == 1 ||
          newArrival == "1"
          ? 1
          : 0;

      if (!/^[A-Z]/.test(title)) {
        return {
          status: false,
          message: "Title must start with a capital letter !",
        };
      }

      const [productId] = await knex("products").insert({
        categoryId,
        subCategoryId,
        title,
        description,
        stockNumber,
        original_price,
        selling_price,
        metals,
        stoneShapeId,
        purity: purity,
        estimatedTime,
        topSelling: topSellingBool,
        discounted: discountedBool,
        readyToShip: readyToShipBool,
        newArrival: newArrivalBool,
        shortDescription,
        diamondCut,
      });

      if (productMaterials && typeof productMaterials === "string") {
        await knex("productMaterial").insert({ productId, productMaterials });
      }

      return {
        status: true,
        message: "Product added successfully!",
      };
    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: "Something went wrong !!",
      };
    }
  }

  async addMedia(body, files) {
    try {
      const { stockNumber, metalId } = body;
      if (!stockNumber || !metalId) {
        return {
          status: false,
          message: "stockNumber and metalId are required",
        };
      }

      const metalIdInt = parseInt(metalId);

      const product = await knex("products").where({ stockNumber }).first();
      if (!product) {
        return {
          status: false,
          message: `Product with stockNumber ${stockNumber} not found`,
        };
      }

      const productId = product.id;

      if (!files || Object.keys(files).length === 0) {
        return { status: false, message: "No files uploaded" };
      }

      const convert = await converter(files.images);
      // console.log(convert, "----------------------converted");
      // const awsUpload = await uploadToS3(files?.images);

      // if (!awsUpload) {
      //   return {
      //     status: false,
      //     message: 'Product not added !!'
      //   }
      // }

      // const images = files?.images || [];
      const images = convert;
      const videoFile = files?.video?.[0];
      const videoFilename = videoFile ? videoFile.filename : null;

      for (const img of images) {
        await knex("product_images").insert({
          productId,
          metalId: metalIdInt,
          image: img.filename,
          video: null,
        });
      }

      if (videoFilename) {
        await knex("product_images").insert({
          productId,
          metalId: metalIdInt,
          image: null,
          video: videoFilename,
        });
      }

      return {
        status: true,
        message: "Media added successfully !",
      };
    } catch (err) {
      console.error(err);
      return {
        status: false,
        message: "Something went wrong",
      };
    }
  }

  // async deleteMedia(body) {
  //   try {
  //     const { productId, metalId, type, fileName } = body;

  //     if (!productId || !metalId) {
  //       return {
  //         status: false,
  //         message: 'productId and metalId are required'
  //       };
  //     }

  //     if (type && !['image', 'video', 'all'].includes(type)) {
  //       return {
  //         status: false,
  //         message: 'Invalid type. Must be "image", "video", or "all".'
  //       };
  //     }

  //     const records = await knex('product_images').where({ productId, metalId });

  //     if (!records || records.length === 0) {
  //       return {
  //         status: false,
  //         message: 'No matching media found for this product'
  //       };
  //     }

  //     for (const record of records) {
  //       if (type === 'image' || type === 'all') {
  //         if (record.image) {
  //           const imgPath = path.join(process.cwd(), 'public/uploads/productmedia', record.image);
  //           if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  //           await knex('product_images').where({ id: record.id }).update({ image: null });
  //         }
  //       }

  //       if (type === 'video' || type === 'all') {
  //         if (record.video) {
  //           const vidPath = path.join(process.cwd(), 'public/uploads/productmedia', record.video);
  //           if (fs.existsSync(vidPath)) fs.unlinkSync(vidPath);
  //           await knex('product_images').where({ id: record.id }).update({ video: null });
  //         }
  //       }

  //       if (fileName) {
  //         const cleanFileName = fileName.startsWith('/') ? fileName.substring(1) : fileName;

  //         if (record.image === cleanFileName) {
  //           const imgPath = path.join(process.cwd(), 'public/uploads/productmedia', cleanFileName);
  //           if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  //           await knex('product_images').where({ id: record.id }).update({ image: null });
  //         }

  //         if (record.video === cleanFileName) {
  //           const vidPath = path.join(process.cwd(), 'public/uploads/productmedia', cleanFileName);
  //           if (fs.existsSync(vidPath)) fs.unlinkSync(vidPath);
  //           await knex('product_images').where({ id: record.id }).update({ video: null });
  //         }
  //       }
  //     }

  //     return {
  //       status: true,
  //       message:
  //         type === 'all'
  //           ? 'All media (images and videos) deleted successfully!'
  //           : `${type || 'Selected media'} deleted successfully!`
  //     };
  //   } catch (err) {
  //     console.error('Error deleting media:', err);
  //     return {
  //       status: false,
  //       message: 'Something went wrong while deleting media'
  //     };
  //   }
  // }

  // async deleteImage(body) {
  //   try {
  //     const { productId, metalId, image } = body;

  //     if (!productId || !metalId || !image) {
  //       return {
  //         status: false,
  //         message: 'productId, metalId, and image are required'
  //       };
  //     }

  //     // Clean image path (remove leading slash)
  //     const imageName = image.startsWith('/') ? image.substring(1) : image;

  //     const record = await knex('product_images')
  //       .where({ productId, metalId, image: imageName })
  //       .first();

  //     if (!record) {
  //       return {
  //         status: false,
  //         message: 'No matching image found for this product'
  //       };
  //     }

  //     const imagePath = path.join(process.cwd(), 'uploads', imageName);
  //     if (fs.existsSync(imagePath)) {
  //       fs.unlinkSync(imagePath);
  //     }

  //     await knex('product_images')
  //       .where({ productId, metalId, image: imageName })
  //       .del();

  //     return {
  //       status: true,
  //       message: 'Image deleted successfully!'
  //     };

  //   }
  //   catch (err) {
  //     console.error('Error deleting image:', err);
  //     return {
  //       status: false,
  //       message: 'Something went wrong while deleting image'
  //     };
  //   }
  // }

  async deleteMedia(body) {
    try {
      const { productId, metalId, type, fileName } = body;

      if (!productId || !metalId || !type || !fileName) {
        return {
          status: false,
          message: "productId, metalId, type, and fileName are required",
        };
      }

      if (!["image", "video"].includes(type)) {
        return {
          status: false,
          message: 'Invalid type. Must be "image" or "video".',
        };
      }

      // Clean filename
      const cleanFileName = fileName.startsWith("/")
        ? fileName.substring(1)
        : fileName;

      // Find the record in DB
      const record = await knex("product_images")
        .where({ productId, metalId })
        .andWhere(function () {
          if (type === "image") this.where("image", cleanFileName);
          if (type === "video") this.where("video", cleanFileName);
        })
        .first();

      if (!record) {
        return {
          status: false,
          message: `No matching ${type} found for this product`,
        };
      }

      // Delete file from filesystem
      const filePath = path.join(
        process.cwd(),
        "public/uploads/productmedia",
        cleanFileName
      );
      // if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      deleteFromS3(`public/uploads/productmedia/${record.image}`)

      // Delete DB record or update null
      if (type === "image") {
        await knex("product_images")
          .where({ id: record.id })
          .update({ image: null });
      } else if (type === "video") {
        await knex("product_images")
          .where({ id: record.id })
          .update({ video: null });
      }

      return {
        status: true,
        message: `${type.charAt(0).toUpperCase() + type.slice(1)
          } deleted successfully!`,
      };
    } catch (err) {
      console.error("Error deleting media:", err);
      return {
        status: false,
        message: "Something went wrong while deleting media",
      };
    }
  }

  async list(query) {
    try {
      const { categoryId, readyToShip, discounted, topSelling, newArrival } =
        query || {};

      const productIdsQuery = knex("products").select("id");

      if (
        categoryId !== undefined &&
        categoryId !== null &&
        categoryId !== ""
      ) {
        const catId = parseInt(categoryId);
        if (!isNaN(catId)) {
          productIdsQuery.where("products.categoryId", catId);
        }
      }

      const applyBooleanFilter = (column, value) => {
        if (value !== undefined && value !== null && value !== "") {
          const isTrue =
            value === true || value === "true" || value === 1 || value === "1";
          productIdsQuery.where(function () {
            if (isTrue) {
              this.where(column, 1).orWhere(column, "1").orWhere(column, true);
            } else {
              this.where(column, 0).orWhere(column, "0").orWhere(column, false);
            }
          });
        }
      };

      applyBooleanFilter("products.readyToShip", readyToShip);
      applyBooleanFilter("products.discounted", discounted);
      applyBooleanFilter("products.topSelling", topSelling);
      applyBooleanFilter("products.newArrival", newArrival);

      const productIdsRaw = await productIdsQuery;
      const allProductIds = productIdsRaw.map((p) => p.id);

      if (!allProductIds.length) {
        return {
          status: true,
          message: "Product list fetched successfully!",
          data: [],
        };
      }

      const data = await knex("products")
        .leftJoin("product_images", "products.id", "product_images.productId")
        .leftJoin("productMaterial", "products.id", "productMaterial.productId")
        .leftJoin("metals", "product_images.metalId", "metals.id")
        .leftJoin("category", "products.categoryId", "category.id")
        .leftJoin("subCategory", "products.subCategoryId", "subCategory.id")
        .select(
          "products.*",
          "product_images.image",
          "product_images.video",
          "product_images.metalId",
          "metals.name as metalName",
          "productMaterial.productMaterials",
          "category.name as categoryName",
          "subCategory.name as subCategoryName"
        )
        .whereIn("products.id", allProductIds)
        .orderBy("products.createdAt", "desc");

      const baseUrl = process.env.PRODUCT_BASE_URL || "";
      const productMap = {};
      const result = [];

      data.forEach((item) => {
        if (!productMap[item.id]) {
          productMap[item.id] = {
            ...item,
            media: [],
            productMaterials: item.productMaterials
              ? JSON.parse(item.productMaterials)
              : null,
            purity: item.purity ? JSON.parse(item.purity) : null,
          };
          result.push(productMap[item.id]);
        }

        if (item.metalId) {
          let metalObj = productMap[item.id].media.find(
            (m) => m.id === item.metalId
          );
          if (!metalObj) {
            metalObj = {
              id: item.metalId,
              name: item.metalName,
              images: [],
              videos: [],
            };
            productMap[item.id].media.push(metalObj);
          }

          if (item.image)
            metalObj.images.push(
              `${baseUrl}/uploads/productmedia/${item.image}`
            );
          if (item.video)
            metalObj.videos.push(
              `${baseUrl}/uploads/productmedia/${item.video}`
            );
        }
      });

      result.forEach((p) => {
        delete p.image;
        delete p.video;
        delete p.metalName;
        delete p.metalId;
      });

      return {
        status: true,
        message: "Product list fetched successfully!",
        data: result,
      };
    } catch (err) {
      console.error(err);
      return {
        status: false,
        message: "Something went wrong!",
        error: err.message,
      };
    }
  }

  async detail(params) {
    try {
      const { id } = params;

      // Fetch product
      const product = await knex("products").where({ id }).first();
      if (!product) {
        return { status: false, message: "No data found with this id !!" };
      }

      // Fetch media and join metals
      const mediaData = await knex("product_images as pi")
        .leftJoin("metals as m", "pi.metalId", "m.id")
        .where("pi.productId", id)
        .select("pi.image", "pi.video", "pi.metalId", "m.name as metalName");

      // Parse productMaterials and purity
      const productMaterial = await knex("productMaterial")
        .where({ productId: id })
        .first();
      const purity = product.purity ? JSON.parse(product.purity) : null;

      const baseUrl = process.env.PRODUCT_BASE_URL || "";

      // Group media by metal
      const media = [];
      mediaData.forEach((item) => {
        if (!item.metalId) return;

        let metalObj = media.find((m) => m.id === item.metalId);
        if (!metalObj) {
          metalObj = {
            id: item.metalId,
            name: item.metalName,
            images: [],
            videos: [],
          };
          media.push(metalObj);
        }

        // Add images (support multiple comma-separated images)
        if (item.image) {
          item.image.split(",").forEach((img) => {
            metalObj.images.push(
              `${baseUrl}/uploads/productmedia/${img.trim()}`
            );
          });
        }

        // Add video
        if (item.video) {
          metalObj.videos.push(`${baseUrl}/uploads/productmedia/${item.video}`);
        }
      });

      return {
        status: true,
        message: "Product fetched successfully!",
        data: {
          ...product,
          media, // array of metals with images/videos
          productMaterials: productMaterial?.productMaterials
            ? JSON.parse(productMaterial.productMaterials)
            : null,
          purity,
        },
      };
    } catch (err) {
      console.error(err);
      return {
        status: false,
        message: "Something went wrong !!",
        error: err.message,
      };
    }
  }

  async delete(params) {
    try {
      const { id } = params;

      const data = await knex("products").where({ id }).first();
      if (!data) {
        return {
          status: false,
          message: "No data found !!",
        };
      }

      const media = await knex("product_images").where({ productId: id }).first();
      // console.log("🚀 ~ productService ~ delete ~ media:", media);

      if (media) {
        const imageList = (media.image || "")
          .split(",")
          .map((img) => img.trim())
          .filter(Boolean);

        imageList.forEach((filename) => {
          const fullPath = path.join(
            process.cwd(),
            "public",
            "uploads",
            "productmedia",
            filename
          );
          fs.unlink(fullPath, (err) => {
            if (err) console.log(err);
          });
          deleteFromS3(`public/uploads/productmedia/${filename}`);
        });

        if (media.video) {
          const videoPath = path.join(
            process.cwd(),
            "public",
            "uploads",
            "productmedia",
            media.video
          );
          fs.unlink(videoPath, (err) => {
            if (err) console.log(err);
          });
        }

        await knex("product_images").where({ productId: id }).del();
      }

      await knex("products").where({ id }).del();

      return {
        status: true,
        message: "Product deleted successfully !!",
      };
    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: "Something went wrong !!",
      };
    }
  }


  async edit(params, body, files) {
    try {
      const { id } = params;
      const {
        categoryId,
        subCategoryId,
        title,
        description,
        stockNumber,
        original_price,
        selling_price,
        estimatedTime,
        readyToShip,
        discounted,
        topSelling,
        productMaterials,
        shortDescription,
        newArrival,
        metalId,
        stoneShapeId,
        purity,
        diamondCut,
      } = body;

      const product = await knex("products").where({ id }).first();
      if (!product) {
        return {
          status: false,
          message: "No product found !!",
        };
      }

      const productUpdateFields = {};
      const fields = {
        categoryId,
        subCategoryId,
        title,
        description,
        stockNumber,
        original_price,
        selling_price,
        estimatedTime,
        shortDescription,
        newArrival,
        metalId,
        stoneShapeId,
        purity,
        diamondCut,
        readyToShip: readyToShip === true || readyToShip === "true" ? 1 : 0,
        discounted: discounted === true || discounted === "true" ? 1 : 0,
        topSelling: topSelling === true || topSelling === "true" ? 1 : 0,
        newArrival: newArrival === true || newArrival === "true" ? 1 : 0,
      };

      for (const key in fields) {
        if (fields[key] !== undefined && fields[key] !== null) {
          productUpdateFields[key] = fields[key];
        }
      }

      productUpdateFields.updatedAt = knex.fn.now();
      await knex("products").where({ id }).update(productUpdateFields);

      if (productMaterials && typeof productMaterials === "string") {
        const existing = await knex("productMaterial")
          .where({ productId: Number(id) })
          .first();

        if (existing) {
          const updated = await knex("productMaterial")
            .where({ productId: Number(id) })
            .update({
              productMaterials: productMaterials,
              updatedAt: knex.fn.now(),
            });

          // console.log("rows updated:", updated);
        } else {
          const inserted = await knex("productMaterial").insert({
            productId: Number(id),
            productMaterials: productMaterials,
            createdAt: knex.fn.now(),
            updatedAt: knex.fn.now(),
          });

          // console.log("inserted:", inserted);
        }
      }

      // if (files && (files.images || files.video)) {
      //   const imageFiles = Array.isArray(files.images) ? files.images : [files.images];
      //   const videoFile = Array.isArray(files.video) ? files.video[0] : files.video;

      //   const newImageFilenames = imageFiles.filter(Boolean).map(file => file.filename);
      //   const newVideoFilename = videoFile?.filename || null;

      //   const existingMedia = await knex('product_images').where({ productId: id }).first();

      //   if (existingMedia) {
      //     let oldImages = existingMedia.image ? existingMedia.image.split(',') : [];

      //     let combinedImages = [...oldImages, ...newImageFilenames];

      //     while (combinedImages.length > 10) {
      //       const removedImage = combinedImages.shift();
      //       const imgPath = path.join(process.cwd(), 'public', 'uploads', 'productmedia', removedImage.trim());
      //       if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      //     }

      //     const finalImageList = combinedImages.filter(Boolean).join(',');

      //     if (newVideoFilename && existingMedia.video) {
      //       const oldVideoPath = path.join(process.cwd(), 'public', 'uploads', 'productmedia', existingMedia.video);
      //       if (fs.existsSync(oldVideoPath)) fs.unlinkSync(oldVideoPath);
      //     }

      //     await knex('product_images')
      //       .where({ productId: id })
      //       .update({
      //         image: finalImageList,
      //         video: newVideoFilename || existingMedia.video,
      //         updatedAt: knex.fn.now()
      //       });
      //   } else {
      //     await knex('product_images').insert({
      //       productId: id,
      //       image: newImageFilenames.slice(0, 10).join(','),
      //       video: newVideoFilename,
      //       createdAt: knex.fn.now(),
      //       updatedAt: knex.fn.now()
      //     });
      //   }
      // }

      return {
        status: true,
        message: "Product updated successfully!",
      };
    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: "Something went wrong!",
      };
    }
  }

  async addtopSelling(params) {
    try {
      const { id } = params;
      const productdata = await knex("products").where({ id }).first();
      if (!productdata) {
        return {
          status: false,
          message: "No product found with this id !! ",
        };
      }

      if (productdata.topSelling === 1) {
        return {
          status: false,
          message: "Product already exist in Top Selling !!",
        };
      }

      await knex("products").where({ id }).update({
        topSelling: 1,
      });

      return {
        status: true,
        message: "Product added to topSelling successfully !!",
      };
    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: "Something went wrong !!",
      };
    }
  }

  async removetopSelling(params) {
    try {
      const { id } = params;
      const productdata = await knex("products").where({ id }).first();
      if (!productdata) {
        return {
          status: false,
          message: "No product found with this id !! ",
        };
      }

      await knex("products").where({ id }).update({
        topSelling: 0,
      });

      return {
        status: true,
        message: "Product removed from topSelling !!",
      };
    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: "Something went wrong !!",
      };
    }
  }

  async addCsv(file) {
    try {
      if (!file) {
        return {
          status: false,
          message: "File is required !!",
        };
      }
      const filepath = file.path;
      // console.log(filepath);

      const data = await csvtojson().fromFile(filepath);
      if (data.length === 0) {
        return {
          status: false,
          message: "CSV is empty",
        };
      }
      // console.log(data, "data");

      function yesNoToBool(value) {
        if (!value) return 0;
        return value.toLowerCase() === "yes" ? 1 : 0;
      }

      const productData = data.map((product) => ({
        title: product.Title,
        stockNumber: product.StockNo,
        original_price: product.Original_price || 0,
        selling_price: product.Selling_price || 0,
        shortDescription: product.Short_description || null,
        estimatedTime: product.Estimated_delivery_time || null,
        categoryId: product.Category,
        subCategoryId: product.Sub_category,
        metalId: product.metals,
        stoneShapeId: product.stone_shape,
        goldPurityId: product.gold_purity,
        topSelling: yesNoToBool(product.top_selling),
        readyToShip: yesNoToBool(product.ready_to_ship),
        discounted: yesNoToBool(product.Discounted),
        newArrival: yesNoToBool(product.new_arrival),
      }));
      // console.log(productData, "productData");

      const insertedProducts = [];
      const skippedProducts = [];

      for (const product of productData) {
        const exists = await knex("products")
          .where(function () {
            this.where("title", product.title).orWhere(
              "stockNumber",
              product.stockNumber
            );
          })
          .first();

        if (exists) {
          skippedProducts.push({
            title: product.title,
            stockNumber: product.stockNumber,
          });
          continue;
        }

        await knex("products").insert(product);
        insertedProducts.push(product.title);
      }
      return {
        status: true,
        message: "Product added successfully !!",
      };
    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: "Something went wrong !!",
      };
    }
  }

  async goldPrice(query) {
    try {
      let config = {
        method: "get",
        maxBodyLength: Infinity,
        url: "https://api.metalpriceapi.com/v1/latest?api_key=5be4d99074e736b5150765f36f8848e9&base=INR&currencies=EUR,XAU,XAG,INR",
        headers: {},
      };

      const response = await axios.request(config);

      if (!response.data) {
        return {
          status: false,
          message: "No data found.",
          data: [],
        };
      }

      const resData = response?.data;
      // console.log("🚀 ~ productService ~ goldPrice ~ resData:", resData);

      // const resData = {
      //   "success": true,
      //   "base": "INR",
      //   "timestamp": 1762732799,
      //   "rates": {
      //     "EUR": 0.0097515664,
      //     "INR": 1,
      //     "INREUR": 102.5476273685,
      //     "INRINR": 1,
      //     "INRXAG": 4283.2135646635,
      //     "INRXAU": 354708.4573103323,
      //     "XAG": 0.0002334696,
      //     "XAU": 0.0000028192
      //   }
      // }

      const inrXauRate = Number(resData.rates.INRXAU.toFixed(4));
      // console.log("inrXauRate -> ", inrXauRate)

      const inrRate = Number((inrXauRate / 28.3495).toFixed(4));
      // console.log("inrRate -> ", inrRate)

      const caretRate = Number((Number(query.caret) / 24).toFixed(4));
      // console.log("caretRate -> ", caretRate)

      const finalPrice = Number((inrRate * caretRate).toFixed(0));
      // console.log("finalPrice -> ", finalPrice)

      return {
        status: true,
        message: "Gold price fetched successfully!!",
        price: finalPrice,
      };
    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: "Something went wrong !!",
      };
    }
  }
}

export default new productService();
