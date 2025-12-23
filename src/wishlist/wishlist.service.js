import knex from "../common/config/database.config";
import productResource from "../admin/products/resources/product.resource";
import CurrencyConverter from "currency-converter-lt";
import { Convert } from "easy-currencies";
import { number } from "joi";


class wishlistService {
  async add(authUser, body) {
    try {
      const { product_id, purityValue, metalId } = body;
      // console.log(body, 'bodyAdd')

      if (!product_id || purityValue == null || metalId == null) {
        return {
          status: false,
          message: 'Product ID, purity, and metal are required !!'
        };
      }

      const existingWishlist = await knex('wishlist')
        .where({ user_id: authUser.id })
        .first();

      const newItem = {
        product_id,
        purityValue,
        metalId,
        addedAt: new Date().toISOString()
      };

      if (existingWishlist) {
        let products = [];
        try {
          products = JSON.parse(existingWishlist.product_id || '[]');
        } catch (err) {
          products = [];
        }

        const alreadyExists = products.some(
          p =>
            Number(p.product_id) === Number(product_id) &&
            Number(p.purityValue) === Number(purityValue) &&
            Number(p.metalId) === Number(metalId)
        );

        if (alreadyExists) {
          return {
            status: false,
            message: 'Product already in wishlist !!'
          };
        }

        products.push(newItem);

        await knex('wishlist')
          .where({ user_id: authUser.id })
          .update({
            product_id: JSON.stringify(products),
            updatedAt: knex.fn.now()
          });

      } else {
        await knex('wishlist').insert({
          user_id: authUser.id,
          product_id: JSON.stringify([newItem]),
          createdAt: knex.fn.now(),
          updatedAt: knex.fn.now()
        });
      }

      return {
        status: true,
        message: 'Product added to wishlist successfully !!'
      };

    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
    }
  }

  async list(authUser, query) {
    try {
      const currency = (query.currency || 'INR').toUpperCase().trim();
      const baseUrl = process.env.PRODUCT_BASE_URL || '';

      const row = await knex('wishlist')
        .where('wishlist.user_id', authUser.id)
        .first();

      if (!row) {
        return {
          status: true,
          message: 'Your wishlist is empty !!',
          data: {
            user_id: authUser.id,
            wishlist: []
          }
        };
      }

      const wishlistItems = JSON.parse(row.product_id);

      const productIds = wishlistItems.map(item => item.product_id);

      const data = await knex('products')
        .whereIn('products.id', productIds)
        .leftJoin('product_images as pi', 'products.id', 'pi.productId')
        .leftJoin('metals as m', 'pi.metalId', 'm.id')
        .select(
          'products.id',
          'products.title',
          'products.stockNumber',
          'products.description',
          'products.selling_price',
          'products.original_price',
          'products.purity',
          'pi.image',
          'pi.video',
          'pi.metalId as metalId',
          'm.name as metalName'
        );

      let conversionRate = 1;
      try {
        if (currency !== 'INR') {
          conversionRate = await Convert(1).from('INR').to(currency);
        }
      } catch (err) {
        console.warn('Currency conversion failed:', err.message);
        conversionRate = 1;
      }

      const wishlist = [];

      wishlistItems.forEach(wItem => {
        const productData = data.filter(p => p.id === wItem.product_id);
        if (!productData.length) return;

        const firstItem = productData[0];
        const parsedPurity = firstItem.purity ? JSON.parse(firstItem.purity) : [];

        const filteredPurity = parsedPurity
          .filter(p => Number(p.value) === Number(wItem.purityValue))
          .map(p => ({
            value: p.value,
            name: p.name,
            profitOriginalPrice: p.profitoriginalprice
              ? (Number(p.profitoriginalprice) * conversionRate).toFixed(2)
              : null,
            profitSellingPrice: p.profitsellingprice
              ? (Number(p.profitsellingprice) * conversionRate).toFixed(2)
              : null
          }));

        const media = [];
        productData.forEach(item => {
          if (Number(item.metalId) === Number(wItem.metalId)) {
            let metalObj = media.find(m => m.id === item.metalId);
            if (!metalObj) {
              metalObj = { id: item.metalId, name: item.metalName, images: [], videos: [] };
              media.push(metalObj);
            }

            if (item.image) {
              item.image.split(',').forEach(img =>
                metalObj.images.push(`${baseUrl}/uploads/productmedia/${img.trim()}`)
              );
            }
            if (item.video) {
              metalObj.videos.push(`${baseUrl}/uploads/productmedia/${item.video}`);
            }
          }
        });

        wishlist.push({
          id: firstItem.id,
          title: firstItem.title,
          stockNumber: firstItem.stockNumber,
          description: firstItem.description,
          purity: filteredPurity,
          media
        });
      });

      return {
        status: true,
        message: 'Wishlist fetched successfully!',
        data: {
          user_id: authUser.id,
          wishlist
        }
      };

    } catch (err) {
      console.error(err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
    }
  }

  async delete(body, authUser) {
    try {
      const { product_id, purityValue, metalId } = body;
      const user_id = authUser.id;
      // console.log(body, 'body')

      if (!product_id || purityValue == null || metalId == null) {
        return {
          status: false,
          message: 'Product ID, purity, and metal are required !!'
        };
      }

      const wishlist = await knex('wishlist')
        .where({ user_id })
        .first();

      if (!wishlist) {
        return {
          status: false,
          message: 'Wishlist not found for user !!',
        };
      }

      let products = JSON.parse(wishlist.product_id || '[]');

      const exists = products.some(
        p =>
          Number(p.product_id) === Number(product_id) &&
          Number(p.purityValue) === Number(purityValue) &&
          Number(p.metalId) === Number(metalId)
      );

      if (!exists) {
        return {
          status: false,
          message: 'Product not found in wishlist !!',
        };
      }

      products = products.filter(
        p =>
          !(
            Number(p.product_id) === Number(product_id) &&
            Number(p.purityValue) === Number(purityValue) &&
            Number(p.metalId) === Number(metalId)
          )
      );

      await knex('wishlist')
        .where({ user_id })
        .update({
          product_id: JSON.stringify(products),
          updatedAt: knex.fn.now()
        });

      return {
        status: true,
        message: 'Product removed from wishlist successfully !!'
      };

    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
    }
  }





}

export default new wishlistService()