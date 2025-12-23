import knex from '../common/config/database.config'
import { Convert } from 'easy-currencies'

class productService {
  async Categorylist() {
    try {

      const data = await knex('category').orderBy('createdAt', 'desc')

      if (!data) {
        return {
          status: false,
          message: 'No data found !!'
        }
      }
      return {
        status: true,
        message: 'Category list fetched successfully !!',
        data: data
      }
    }
    catch (err) {
      console.log(err)
      return {
        status: false,
        mesage: 'Something went wrong !!'
      }
    }
  }

  async subCategoryList(query) {
    try {
      const { categoryId } = query;

      let qb = knex('subCategory').select().orderBy('createdAt', 'desc');

      if (categoryId) {
        qb = qb.where('categoryId', categoryId);
      }
      const data = await qb;

      // const data = await qb.paginate({
      //   perPage: perPage ? parseInt(perPage) : 10,
      //   currentPage: page ? parseInt(page) : 1,
      //   isLengthAware: true
      // })

      if (!data || data.length === 0) {
        return {
          status: false,
          message: 'No data found !!'
        };
      }

      return {
        status: true,
        message: 'SubCategory list fetched successfully !!',
        data: data
      };
    }
    catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Something went wrong !!',
        error: err.message
      };
    }
  }

  // async productList(query) {
  //   try {
  //     const {
  //       categoryId,
  //       subCategoryId,
  //       perPage,
  //       metals,
  //       stoneShapeId,
  //       purity,
  //       page,
  //       readyToShip,
  //       discounted,
  //       minPrice,
  //       maxPrice,
  //       topSelling,
  //       newArrival,
  //       search,
  //       currency
  //     } = query;

  //     const selectedCurrency = currency ? currency.toUpperCase().trim() : 'INR';
  //     let conversionRate = 1;
  //     let convertCurrency = false;

  //     // Convert currency if explicitly provided and not INR
  //     if (selectedCurrency !== 'INR') {
  //       try {
  //         conversionRate = await Convert(1).from('INR').to(selectedCurrency);
  //         convertCurrency = true;
  //       } catch (err) {
  //         console.warn('Currency conversion failed:', err.message);
  //         conversionRate = 1;
  //         convertCurrency = false;
  //       }
  //     }

  //     const minPriceInINR = minPrice ? parseFloat(minPrice) / conversionRate : undefined;
  //     const maxPriceInINR = maxPrice ? parseFloat(maxPrice) / conversionRate : undefined;

  //     // Build query
  //     let qb = knex('products')
  //       .leftJoin('product_images as pi', 'products.id', 'pi.productId')
  //       .leftJoin('productMaterial as pm', 'products.id', 'pm.productId')
  //       .leftJoin('metals as m', 'pi.metalId', 'm.id')
  //       .select(
  //         'products.id',
  //         'products.categoryId',
  //         'products.subCategoryId',
  //         'products.title',
  //         'products.description',
  //         'products.stockNumber',
  //         'products.original_price',
  //         'products.selling_price',
  //         'products.diamondCut',
  //         'products.topSelling',
  //         'products.stoneShapeId',
  //         'products.estimatedTime',
  //         'products.readyToShip',
  //         'products.discounted',
  //         'products.newArrival',
  //         'products.shortDescription',
  //         'products.createdAt',
  //         'pi.image',
  //         'pi.video',
  //         'pi.metalId as metalId',
  //         'm.name as metalName',
  //         'pm.productMaterials',
  //         'products.purity'
  //       )
  //       .orderBy('products.createdAt', 'desc');

  //     // Filters
  //     if (categoryId) qb.where('products.categoryId', categoryId);

  //     if (subCategoryId) qb.where('products.subCategoryId', subCategoryId);

  //     if (metals) {
  //       const metalIds = (typeof metals === 'string'
  //         ? metals.split(',').map(id => Number(id.trim()))
  //         : metals.map(Number)
  //       ).filter(Boolean);

  //       if (metalIds.length) {
  //         qb.whereIn('m.id', metalIds);
  //       }
  //     }


  //     if (stoneShapeId) {
  //       const stoneShapeIds = (typeof stoneShapeId === 'string'
  //         ? stoneShapeId.split(',').map(id => Number(id.trim()))
  //         : stoneShapeId.map(Number)
  //       ).filter(Boolean);

  //       if (stoneShapeIds.length) qb.whereIn('products.stoneShapeId', stoneShapeIds);
  //     }

  //     if (purity) {
  //       let purityIds = [];

  //       if (Array.isArray(purity)) {
  //         purityIds = purity.map(p => Number(p)).filter(Boolean);
  //       } else if (typeof purity === 'string') {
  //         purityIds = purity.split(',').map(p => Number(p.trim())).filter(Boolean);
  //       } else if (typeof purity === 'number') {
  //         purityIds = [purity];
  //       }

  //       if (purityIds.length) {
  //         qb.where(function () {
  //           purityIds.forEach(p => {
  //             // MariaDB: pass as stringified JSON number
  //             this.orWhereRaw(`JSON_CONTAINS(products.purity, ?, '$[*].value')`, [JSON.stringify(p)]);
  //           });
  //         });
  //       }
  //     }







  //     const boolFilter = val => (val === true || val === "true" || val === 1 || val === "1") ? 1 : 0;
  //     if (readyToShip !== undefined) qb.where('products.readyToShip', boolFilter(readyToShip));
  //     if (discounted !== undefined) qb.where('products.discounted', boolFilter(discounted));
  //     if (topSelling !== undefined) qb.where('products.topSelling', boolFilter(topSelling));
  //     if (newArrival !== undefined) qb.where('products.newArrival', boolFilter(newArrival));
  //     if (minPriceInINR !== undefined) qb.where('products.selling_price', '>=', minPriceInINR);
  //     if (maxPriceInINR !== undefined) qb.where('products.selling_price', '<=', maxPriceInINR);
  //     if (search) qb.andWhere('products.title', 'like', `%${search}%`);

  //     // Pagination
  //     const data = await qb.paginate({
  //       perPage: perPage ? parseInt(perPage) : 10,
  //       currentPage: page ? parseInt(page) : 1,
  //       isLengthAware: true
  //     });

  //     const baseUrl = process.env.BASE_URL || '';
  //     const productMap = {};
  //     const result = [];

  //     // Transform data
  //     data.data.forEach(item => {
  //       if (!productMap[item.id]) {
  //         const parsedPurity = item.purity ? JSON.parse(item.purity) : [];
  //         const filteredPurity = parsedPurity.map(p => ({
  //           value: p.value,
  //           name: p.name,
  //           profitOriginalPrice: convertCurrency && p.profitoriginalprice ? (Number(p.profitoriginalprice) * conversionRate).toFixed(2) : p.profitoriginalprice ?? null,
  //           profitSellingPrice: convertCurrency && p.profitsellingprice ? (Number(p.profitsellingprice) * conversionRate).toFixed(2) : p.profitsellingprice ?? null
  //         }));

  //         productMap[item.id] = {
  //           ...item,
  //           media: [],
  //           productMaterial: item.productMaterials ? [JSON.parse(item.productMaterials)] : [],
  //           purity: filteredPurity
  //         };
  //         result.push(productMap[item.id]);
  //       }

  //       if (!productMap[item.id]) return; // Safety

  //       // Build media
  //       if (item.metalId) {
  //         let metalObj = productMap[item.id].media.find(m => m.id === item.metalId);
  //         if (!metalObj) {
  //           metalObj = { id: item.metalId, name: item.metalName, images: [], videos: [] };
  //           productMap[item.id].media.push(metalObj);
  //         }

  //         if (item.image) item.image.split(',').forEach(img => metalObj.images.push(`${baseUrl}/uploads/productmedia/${img.trim()}`));
  //         if (item.video) metalObj.videos.push(`${baseUrl}/uploads/productmedia/${item.video}`);
  //       }
  //     });

  //     // Cleanup
  //     result.forEach(p => {
  //       delete p.image;
  //       delete p.video;
  //       delete p.metalName;
  //       delete p.metalId;
  //       delete p.original_price;
  //       delete p.selling_price;
  //     });



  //     return {
  //       status: true,
  //       message: 'Products list fetched successfully !!',
  //       data: result,
  //       pagination: data.pagination
  //     };

  //   } catch (err) {
  //     console.error(err);
  //     return { status: false, message: 'Something went wrong !!' };
  //   }
  // }

  async productList(query) {
    try {
      const {
        categoryId,
        subCategoryId,
        perPage,
        metals,
        stoneShapeId,
        purity,
        page,
        readyToShip,
        discounted,
        topSelling,
        newArrival,
        minPrice,
        maxPrice,
        search,
        currency
      } = query;

      const selectedCurrency = currency ? currency.toUpperCase().trim() : 'INR';
      let conversionRate = 1;
      let convertCurrency = false;

      if (selectedCurrency !== 'INR') {
        try {
          conversionRate = await Convert(1).from('INR').to(selectedCurrency);
          convertCurrency = true;
        } catch (err) {
          console.warn('Currency conversion failed:', err.message);
        }
      }

      const perPageNum = perPage ? parseInt(perPage) : 10;
      const currentPageNum = page ? parseInt(page) : 1;

      const boolFilter = val => (val === true || val === 'true' || val === 1 || val === '1') ? 1 : 0;

      const productIdsQuery = knex('products').select('id');
      if (categoryId) {
        productIdsQuery.where('categoryId', categoryId);
      }

      if (subCategoryId) {
        productIdsQuery.where('subCategoryId', subCategoryId);
      }

      if (readyToShip !== undefined) {
        productIdsQuery.where('readyToShip', boolFilter(readyToShip));
      }

      if (discounted !== undefined) {
        productIdsQuery.where('discounted', boolFilter(discounted));
      }

      if (topSelling !== undefined) {
        productIdsQuery.where('topSelling', boolFilter(topSelling));
      }

      if (newArrival !== undefined) {
        productIdsQuery.where('newArrival', boolFilter(newArrival));
      }


      if (search) {
        productIdsQuery.andWhere(function () {
          this.where('title', 'like', `%${search}%`)
            .orWhere('stockNumber', 'like', `%${search}%`);
        });
      }


      if (stoneShapeId) {
        const stoneShapeIds = (typeof stoneShapeId === 'string'
          ? stoneShapeId.split(',').map(Number)
          : stoneShapeId.map(Number)
        ).filter(Boolean);
        if (stoneShapeIds.length) productIdsQuery.whereIn('stoneShapeId', stoneShapeIds);
      }

      const productIdsRaw = await productIdsQuery;
      let allProductIds = productIdsRaw.map(p => p.id);

      if (!allProductIds.length) {
        return { status: true, message: 'Products list fetched successfully !!', data: [], pagination: {} };
      }

      const rows = await knex('products')
        .leftJoin('product_images as pi', 'products.id', 'pi.productId')
        .leftJoin('productMaterial as pm', 'products.id', 'pm.productId')
        .leftJoin('metals as m', 'pi.metalId', 'm.id')
        .select(
          'products.*',
          'pi.image',
          'pi.video',
          'pi.metalId as metalId',
          'm.name as metalName',
          'pm.productMaterials'
        )
        .whereIn('products.id', allProductIds)
        .modify(qb => {

          if (metals) {
            const metalIds = (typeof metals === 'string'
              ? metals.split(',').map(id => id.trim())
              : metals.map(String)
            );

            qb.where(function () {
              metalIds.forEach(id => {
                this.orWhereRaw(`JSON_CONTAINS(products.metals, '\"${id}\"')`);
              });
            });
          }
        })
        .orderBy('products.createdAt', 'desc');

      let filteredRows = rows;
      if (purity) {
        const purityIds = Array.isArray(purity)
          ? purity.map(Number).filter(Boolean)
          : typeof purity === 'string'
            ? purity.split(',').map(Number).filter(Boolean)
            : [Number(purity)];

        filteredRows = rows.filter(product => {
          if (!product.purity) return false;
          let productPurities = [];
          try {
            productPurities = JSON.parse(product.purity);
          } catch (err) {
            console.warn(`Invalid purity JSON for product ${product.id}:`, product.purity);
            return false;
          }
          return productPurities.some(pObj => purityIds.includes(Number(pObj.value)));
        });
      }


      const baseUrl = process.env.PRODUCT_BASE_URL || '';
      // console.log("🚀 ~ productService ~ productList ~ baseUrl:", baseUrl)

      const productMap = {};
      filteredRows.forEach(item => {
        if (!productMap[item.id]) {
          const parsedPurity = item.purity ? JSON.parse(item.purity) : [];
          const filteredPurity = parsedPurity.map(p => ({
            value: p.value,
            name: p.name,
            profitOriginalPrice: convertCurrency && p.original_price ? (Number(p.original_price) * conversionRate).toFixed(2) : p.original_price ?? null,
            profitSellingPrice: convertCurrency && p.profitsellingprice ? (Number(p.profitsellingprice) * conversionRate).toFixed(2) : p.profitsellingprice ?? null
          }));
          // console.log("🚀 ~ productService ~ productList ~ filteredPurity:", filteredPurity)
          // console.log("🚀 ~ productService ~ productList ~ parsedPurity:", parsedPurity)

          productMap[item.id] = {
            ...item,
            media: [],
            productMaterial: item.productMaterials ? [JSON.parse(item.productMaterials)] : [],
            purity: filteredPurity
          };
        }

        if (item.metalId) {
          let metalObj = productMap[item.id].media.find(m => m.id === item.metalId);
          if (!metalObj) {
            metalObj = { id: item.metalId, name: item.metalName, images: [], videos: [] };
            productMap[item.id].media.push(metalObj);
          }
          if (item.image) item.image.split(',').forEach(img => metalObj.images.push(`${baseUrl}/uploads/productmedia/${img.trim()}`));
          if (item.video) metalObj.videos.push(`${baseUrl}/uploads/productmedia/${item.video}`);
        }
      });

      let filteredResult = Object.values(productMap)
        .map(product => {
          const filteredPurity = product.purity.filter(p => {
            const price = Number(p.profitSellingPrice || 0);
            if (minPrice && price < Number(minPrice)) return false;
            if (maxPrice && price > Number(maxPrice)) return false;
            return true;
          });
          if (filteredPurity.length === 0) return null;
          return { ...product, purity: filteredPurity };
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));


      const total = filteredResult.length;
      const lastPage = Math.ceil(total / perPageNum);
      const offset = (currentPageNum - 1) * perPageNum;
      const paginatedResult = filteredResult.slice(offset, offset + perPageNum);

      paginatedResult.forEach(p => {
        delete p.image;
        delete p.video;
        delete p.metalName;
        delete p.metalId;
        delete p.original_price;
        delete p.profitsellingprice;
      });

      const pagination = {
        perPage: perPageNum,
        currentPage: currentPageNum,
        from: total === 0 ? 0 : offset + 1,
        to: Math.min(offset + perPageNum, total),
        total,
        lastPage,
        prevPage: currentPageNum > 1 ? currentPageNum - 1 : null,
        nextPage: currentPageNum < lastPage ? currentPageNum + 1 : null
      };

      return {
        status: true,
        message: 'Products list fetched successfully !!',
        data: paginatedResult, pagination
      };

    }
    catch (err) {
      console.error(err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
    }
  }


  async topSelling(query) {
    try {
      const currency = (query.currency || 'INR').toUpperCase().trim();
      const baseUrl = process.env.PRODUCT_BASE_URL || '';
      let conversionRate = 1;

      if (currency !== 'INR') {
        try {
          conversionRate = await Convert(1).from('INR').to(currency);
        } catch (err) {
          console.warn('Currency conversion failed:', err.message);
          conversionRate = 1;
        }
      }

      const rows = await knex('products as p')
        .leftJoin('product_images as pi', 'p.id', 'pi.productId')
        .leftJoin('metals as m', 'pi.metalId', 'm.id')
        .select(
          'p.id',
          'p.title',
          'p.stockNumber',
          'p.purity',
          'pi.image',
          'pi.video',
          'pi.metalId',
          'm.name as metalName'
        )
        .where('p.topSelling', 1)
        .orderBy('p.createdAt', 'desc');

      const productMap = {};

      rows.forEach(item => {
        let purityArr = [];
        if (item.purity) {
          try {
            purityArr = JSON.parse(item.purity).map(p => ({
              value: p.value,
              name: p.name,
              profitOriginalPrice: p.profitoriginalprice
                ? (Number(p.profitoriginalprice) * conversionRate).toFixed(2)
                : null,
              profitSellingPrice: p.profitsellingprice
                ? (Number(p.profitsellingprice) * conversionRate).toFixed(2)
                : null
            }));
          } catch (e) {
            console.warn(`Failed to parse purity for product ${item.id}:`, e.message);
          }
        }
        if (!productMap[item.id]) {
          productMap[item.id] = {
            id: item.id,
            title: item.title,
            stockNumber: item.stockNumber,
            purity: purityArr,
            media: []
          };
        }

        if (item.metalId) {
          let metalObj = productMap[item.id].media.find(m => m.id === item.metalId);
          if (!metalObj) {
            metalObj = {
              id: item.metalId,
              name: item.metalName,
              images: [],
              videos: []
            };
            productMap[item.id].media.push(metalObj);
          }
          if (item.image) item.image.split(',').forEach(img => metalObj.images.push(`${baseUrl}/uploads/productmedia/${img.trim()}`));
          if (item.video) item.video.split(',').forEach(v => metalObj.videos.push(`${baseUrl}/uploads/productmedia/${v.trim()}`));
        }
      });

      const result = Object.values(productMap);

      return {
        status: true,
        message: 'Top selling data fetched successfully !!',
        data: result
      };

    } catch (err) {
      console.error('Top selling error:', err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
    }
  }

  async metalsList() {
    try {
      const data = await knex('metals').orderBy('createdAt', 'desc')
      if (!data) {
        return {
          status: true,
          message: 'No data found !!'
        }
      }
      return {
        status: true,
        message: 'metals list fetched successfully !!',
        data: data
      }
    }
    catch (err) {
      console.log(err)
      return {
        status: false,
        mesage: 'Something went wrong !!'
      }
    }
  }

  async getStoneShape() {
    try {
      const data = await knex('stoneShape').orderBy('createdAt', 'desc')
      if (!data) {
        return {
          status: true,
          mesage: 'No data found !!'
        }
      }
      return {
        status: true,
        message: 'stoneShape list fetched successfully !!',
        data: data
      }
    }
    catch (err) {
      console.log(err)
      return {
        status: false,
        mesage: 'Something went wrong !!'
      }
    }
  }

  async getgoldPurity() {
    try {

      const data = await knex('goldPurity').orderBy('createdAt', 'desc')

      if (!data.length < 0) {
        return {
          status: true,
          message: 'No data found !!'
        }
      }

      return {
        status: true,
        message: 'goldPurity list fetched successfully !!',
        data: data
      }
    }
    catch (err) {
      console.log(err)
      return {
        status: false,
        mesage: 'Something went wrong !!'
      }
    }
  }

  async detail(params, query) {
    try {
      const { id } = params;
      const currency = (query.currency || 'INR').toUpperCase().trim();

      if (!id) {
        return { status: false, message: 'Product ID is required' };
      }

      // Fetch product data with images, metals, and materials
      const data = await knex('products as p')
        .leftJoin('product_images as pi', 'p.id', 'pi.productId')
        .leftJoin('productMaterial as pm', 'p.id', 'pm.productId')
        .leftJoin('metals as m', 'pi.metalId', 'm.id')
        .select(
          'p.id',
          'p.categoryId',
          'p.subCategoryId',
          'p.title',
          'p.description',
          'p.shortDescription',
          'p.stockNumber',
          'p.original_price',
          'p.selling_price',
          'p.diamondCut',
          'p.topSelling',
          'p.stoneShapeId',
          'p.estimatedTime',
          'p.readyToShip',
          'p.discounted',
          'p.newArrival',
          'p.purity',
          'p.createdAt',
          'pi.image',
          'pi.video',
          'pi.metalId as metalId',
          'm.name as metalName',
          'pm.productMaterials'
        )
        .where('p.id', id);

      if (!data || data.length === 0) {
        return { status: false, message: 'No data found !!' };
      }

      const baseUrl = process.env.PRODUCT_BASE_URL || '';

      // Currency conversion
      let conversionRate = 1;
      try {
        if (currency !== 'INR') {
          conversionRate = await Convert(1).from('INR').to(currency);
        }
      } catch (err) {
        console.warn('Currency conversion failed:', err.message);
        conversionRate = 1;
      }

      const item = data[0];

      // Parse purity and map prices
      const parsedPurity = item.purity ? JSON.parse(item.purity) : [];
      // console.log("🚀 ~ productService ~ detail ~ parsedPurity:", parsedPurity)

      const filteredPurity = parsedPurity.map(p => ({
        value: p.value,
        name: p.name,
        profitOriginalPrice: p.original_price
          ? (Number(p.original_price) * conversionRate).toFixed(2)
          : null,
        profitSellingPrice: p.profitsellingprice
          ? (Number(p.profitsellingprice) * conversionRate).toFixed(2)
          : null
      }));
      // console.log("🚀 ~ productService ~ detail ~ filteredPurity:", filteredPurity)


      // Parse product materials
      const materials = item.productMaterials ? [JSON.parse(item.productMaterials)] : [];

      // Initialize product object
      const product = {
        id: item.id,
        categoryId: item.categoryId,
        subCategoryId: item.subCategoryId,
        title: item.title,
        description: item.description,
        shortDescription: item.shortDescription,
        stockNumber: item.stockNumber,
        original_price: item.original_price
          ? (Number(item.original_price) * conversionRate).toFixed(2)
          : null,
        selling_price: item.profitsellingprice
          ? (Number(item.profitsellingprice) * conversionRate).toFixed(2)
          : null,
        diamondCut: item.diamondCut,
        topSelling: item.topSelling,
        stoneShapeId: item.stoneShapeId,
        estimatedTime: item.estimatedTime,
        readyToShip: item.readyToShip,
        discounted: item.discounted,
        newArrival: item.newArrival,
        createdAt: item.createdAt,
        purity: filteredPurity,
        productMaterials: materials,
        media: []
      };

      // Process media grouped by metal
      data.forEach(row => {
        if (row.metalId) {
          let metalObj = product.media.find(m => m.id === row.metalId);
          if (!metalObj) {
            metalObj = { id: row.metalId, name: row.metalName, images: [], videos: [] };
            product.media.push(metalObj);
          }

          if (row.image) {
            row.image.split(',').forEach(img =>
              metalObj.images.push(`${baseUrl}/uploads/productmedia/${img.trim()}`)
            );
          }

          if (row.video) {
            row.video.split(',').forEach(v =>
              metalObj.videos.push(`${baseUrl}/uploads/productmedia/${v.trim()}`)
            );
          }
        }
      });

      return {
        status: true,
        message: 'Product fetched successfully !!',
        data: { ...product, currency }
      };

    } catch (err) {
      console.error(err);
      return { status: false, message: 'Something went wrong !!' };
    }
  }

  async priceFilter(query) {
    try {
      const {
        categoryId,
        subCategoryId,
        metals,
        stoneShapeId,
        purity,
        readyToShip,
        discounted,
        topSelling,
        newArrival,
        search,
        currency
      } = query;

      const targetCurrency = (currency || 'INR').toUpperCase().trim();
      let conversionRate = 1;

      try {
        if (targetCurrency !== 'INR') {
          conversionRate = await Convert(1).from("INR").to(targetCurrency);
        }
      } catch (err) {
        console.error("Currency conversion error:", err.message);
        conversionRate = 1;
      }

      let qb = knex("products");

      if (categoryId) qb.where("categoryId", categoryId);
      if (subCategoryId) qb.where("subCategoryId", subCategoryId);

      if (metals) {
        const metalIds = typeof metals === "string"
          ? metals.split(",").map(String)
          : metals.map(String);

        qb.where(function () {
          metalIds.forEach(id => {
            this.orWhereRaw(`JSON_CONTAINS(metals, '\"${id}\"')`);
          });
        });
      }

      if (stoneShapeId) {
        const stoneShapeIds = typeof stoneShapeId === "string" ? stoneShapeId.split(",").map(Number) : stoneShapeId.map(Number);
        qb.whereIn("stoneShapeId", stoneShapeIds);
      }

      if (purity) {
        const purityValues = typeof purity === "string" ? purity.split(",").map(Number) : purity.map(Number);

        qb.where(function () {
          purityValues.forEach(val => {
            this.orWhereRaw(`JSON_CONTAINS(purity, JSON_OBJECT('value', ?))`, [val]);
          });
        });
      }


      const booleanFilters = { readyToShip, discounted, topSelling, newArrival };
      for (let key in booleanFilters) {
        const val = booleanFilters[key];
        if (val !== undefined) {
          const intVal = (val === true || val === "true" || val === 1 || val === "1") ? 1 : 0;
          qb.where(key, intVal);
        }
      }

      if (search) qb.andWhere("title", "like", `%${search}%`);

      const products = await qb.select("id", "purity");

      let allPrices = [];
      products.forEach(p => {
        if (p.purity) {
          try {
            const purityArr = JSON.parse(p.purity);
            purityArr.forEach(pr => {
              if (pr.profitsellingprice) allPrices.push(Number(pr.profitsellingprice));
            });
          } catch { }
        }
      });

      if (allPrices.length === 0) allPrices = [0];

      const minPriceINR = Math.min(...allPrices);
      const maxPriceINR = Math.max(...allPrices);

      const minPrice = (minPriceINR * conversionRate).toFixed(2);
      const maxPrice = (maxPriceINR * conversionRate).toFixed(2);

      return {
        status: true,
        message: "Price range fetched successfully !!",
        data: { minPrice, maxPrice }
      };

    }
    catch (err) {
      console.error(err);
      return { status: false, message: "Something went wrong !!" };
    }
  }






}

export default new productService()