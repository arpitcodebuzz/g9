import knex from "../common/config/database.config";
import productResource from "../admin/products/resources/product.resource";
import CurrencyConverter from "currency-converter-lt";
import { Convert } from "easy-currencies";
import { number } from "joi";


class productService {
  async add(authUser, body) {
    try {
      const { products: productId, purityValue, metalId } = body;

      if (!productId || !purityValue || !metalId) {
        return {
          status: false,
          message: 'Product ID, purityValue, and metalId are required !!'
        };
      }

      const existingProductSaved = await knex('productSaved')
        .where({ userId: authUser.id })
        .first();

      const newItem = {
        products: productId,
        purityValue,
        metalId,
        addedAt: new Date().toISOString()
      };

      if (existingProductSaved) {
        let savedProducts = JSON.parse(existingProductSaved.products || '[]');

        const alreadyExists = savedProducts.some(
          p => p.products == productId && p.purityValue == purityValue && p.metalId == metalId
        );
        if (alreadyExists) {
          return {
            status: false,
            message: 'Product already saved with this purity and metal !!'
          };
        }

        savedProducts.push(newItem);

        await knex('productSaved')
          .where({ userId: authUser.id })
          .update({
            products: JSON.stringify(savedProducts),
            updatedAt: new Date()
          });

      } else {
        await knex('productSaved').insert({
          userId: authUser.id,
          products: JSON.stringify([newItem]),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      const cartRow = await knex("cart")
        .where({ userId: authUser.id })
        .first();

      if (cartRow) {
        let cartProducts = JSON.parse(cartRow.products || "[]");

        const updatedCartProducts = cartProducts.filter(p => {
          return !(
            Number(p.productId) === Number(productId) &&
            Number(p.purityValue) === Number(purityValue) &&
            Number(p.metalId) === Number(metalId)
          );
        });

        if (updatedCartProducts.length === 0) {
          await knex("cart").where("id", cartRow.id).update({ products: '[]', updatedAt: new Date() });
        } else {
          await knex("cart")
            .where("id", cartRow.id)
            .update({
              products: JSON.stringify(updatedCartProducts),
              updatedAt: new Date()
            });
        }
      }



      return {
        status: true,
        message: 'Product saved successfully !!'
      };

    } catch (err) {
      console.error(err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
    }
  }


  async list(authUser, query) {
    try {
      const currency = (query.currency || 'INR').toUpperCase().trim();

      const row = await knex('productSaved').where('userId', authUser.id).first();
      if (!row) {
        return {
          status: true,
          message: 'Product list fetched successfully !!',
          data: { user_id: authUser.id, productSaved: [] }
        };
      }

      const savedProducts = JSON.parse(row.products || '[]');
      if (!savedProducts.length) {
        return {
          status: true,
          message: 'Product list fetched successfully !!',
          data: { user_id: authUser.id, productSaved: [] }
        };
      }

      const productIds = savedProducts.map(p => p.products).filter(Boolean);
      if (!productIds.length) {
        return {
          status: true,
          message: 'Product list fetched successfully !!',
          data: { user_id: authUser.id, productSaved: [] }
        };
      }

      const products = await knex('products as p')
        .leftJoin('product_images as pi', 'p.id', 'pi.productId')
        .leftJoin('metals as m', 'pi.metalId', 'm.id')
        .select(
          'p.id',
          'p.title',
          'p.description',
          'p.stockNumber',
          'p.shortDescription',
          'p.estimatedTime',
          'p.purity',
          'pi.image',
          'pi.video',
          'pi.metalId',
          'm.name as metalName'
        )
        .whereIn('p.id', productIds);

      const baseUrl = process.env.PRODUCT_BASE_URL || '';
      let conversionRate = 1;
      try {
        if (currency !== 'INR') conversionRate = await Convert(1).from('INR').to(currency);
      } catch {
        conversionRate = 1;
      }

      const productMap = {};
      products.forEach(p => {
        if (!productMap[p.id]) productMap[p.id] = [];
        productMap[p.id].push(p);
      });

      const productSavedList = [];

      savedProducts.forEach(saved => {
        const productRows = productMap[saved.products];
        if (!productRows || !productRows.length) return;

        const productData = productRows[0];

        const parsedPurity = productData.purity ? JSON.parse(productData.purity) : [];
        const selectedPurity = parsedPurity.find(p => Number(p.value) === Number(saved.purityValue));

        const metalRows = productRows.filter(p => Number(p.metalId) === Number(saved.metalId));
        const mediaMap = {};

        (metalRows.length ? metalRows : productRows).forEach(p => {
          if (!mediaMap[p.metalId]) {
            mediaMap[p.metalId] = { id: p.metalId, name: p.metalName, images: [], videos: [] };
          }
          if (p.image) mediaMap[p.metalId].images.push(...p.image.split(',').map(i => `${baseUrl}/uploads/productmedia/${i.trim()}`));
          if (p.video) mediaMap[p.metalId].videos.push(...p.video.split(',').map(v => `${baseUrl}/uploads/productmedia/${v.trim()}`));
        });

        const mediaItems = Object.values(mediaMap);

        // Correct keys for prices
        const profitOriginalPrice = selectedPurity?.profitoriginalprice
          ? (Number(selectedPurity.profitoriginalprice) * conversionRate).toFixed(2)
          : null;
        const profitSellingPrice = selectedPurity?.profitsellingprice
          ? (Number(selectedPurity.profitsellingprice) * conversionRate).toFixed(2)
          : profitOriginalPrice;

        const quantity = saved.qty || 1;
        const totalPrice = profitSellingPrice ? (Number(profitSellingPrice) * quantity).toFixed(2) : null;

        productSavedList.push({
          productId: productData.id,
          title: productData.title,
          stockNumber:productData.stockNumber,
          description: productData.description,
          shortDescription: productData.shortDescription,
          estimatedTime: productData.estimatedTime,
          quantity,
          purity: selectedPurity
            ? {
              value: selectedPurity.value,
              name: selectedPurity.name,
              profitOriginalPrice,
              profitSellingPrice
            }
            : null,
          metalId: saved.metalId,
          media: mediaItems,
          addedAt: saved.addedAt,
          totalPrice
        });
      });

      return {
        status: true,
        message: 'Product list fetched successfully !!',
        data: { user_id: authUser.id, productSaved: productSavedList }
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
      const { productId, purityValue, metalId } = body;
      const userId = authUser.id;

      if (!productId) {
        return {
          status: false,
          message: 'Product ID is required !!'
        };
      }

      const productSaved = await knex('productSaved')
        .where({ userId })
        .first();

      if (!productSaved) {
        return {
          status: false,
          message: 'Saved product not found for user !!'
        };
      }

      let savedProducts = JSON.parse(productSaved.products || '[]');

      let filteredProducts;
      if (purityValue != null && metalId != null) {
        filteredProducts = savedProducts.filter(
          p =>
            !(
              Number(p.products) === Number(productId) &&
              Number(p.purityValue) === Number(purityValue) &&
              Number(p.metalId) === Number(metalId)
            )
        );
      } else {
        filteredProducts = savedProducts.filter(p => Number(p.products) !== Number(productId));
      }

      if (filteredProducts.length === savedProducts.length) {
        return {
          status: false, message:
            'Product not found in saved list!'
        };
      }

      if (filteredProducts.length === 0) {
        await knex('productSaved').where({ userId }).del();
      } else {
        await knex('productSaved')
          .where({ userId })
          .update({ products: JSON.stringify(filteredProducts), updatedAt: new Date() });
      }

      return {
        status: true,
        message: 'Product removed from saved list !!'
      };
    }
    catch (err) {
      console.error(err);
      return { status: false, message: 'Something went wrong !!' };
    }
  }


  async movetoCart(authUser, body) {
    try {
      const { productId, purityValue, metalId } = body; 

      if (!productId || purityValue == null || metalId == null) {
        return {
          status: false,
          message: 'Product ID, purity, and metal are required !!'
        };
      }

      const existingProductSaved = await knex('productSaved')
        .where({ userId: authUser.id })
        .first();

      if (!existingProductSaved) {
        return {
          status: false,
          message: 'No saved products found !!'
        };
      }

      let savedProducts = [];
      try {
        savedProducts = JSON.parse(existingProductSaved.products || '[]');
      } catch (e) {
        console.error("Invalid JSON in productSaved.products:", e);
        savedProducts = [];
      }

      const productIndex = savedProducts.findIndex(
        p =>
          Number(p.products) === Number(productId) &&
          Number(p.purityValue) === Number(purityValue) &&
          Number(p.metalId) === Number(metalId)
      );

      if (productIndex === -1) {
        return {
          status: false, message:
            'Product not found in saved list !!'
        };
      }

      const [movingProduct] = savedProducts.splice(productIndex, 1);

      const cartRow = await knex('cart').where({ userId: authUser.id }).first();

      const newCartItem = {
        productId,
        purityValue,
        metalId,
        addedAt: new Date().toISOString()
      };

      if (cartRow) {
        let cartProducts = [];
        try {
          cartProducts = JSON.parse(cartRow.products || '[]');
        } catch (e) {
          console.error("Invalid JSON in cart.products:", e);
          cartProducts = [];
        }

        const alreadyInCart = cartProducts.some(
          p =>
            Number(p.product_id) === Number(productId) &&
            Number(p.purityValue) === Number(purityValue) &&
            Number(p.metalId) === Number(metalId)
        );

        if (!alreadyInCart) cartProducts.push(newCartItem);

        await knex('cart')
          .where({ id: cartRow.id })
          .update({
            products: JSON.stringify(cartProducts),
            updatedAt: new Date()
          });

      } else {
        await knex('cart').insert({
          userId: authUser.id,
          products: JSON.stringify([newCartItem]),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      if (savedProducts.length === 0) {
        await knex('productSaved').where({ id: existingProductSaved.id }).del();
      } else {
        await knex('productSaved')
          .where({ id: existingProductSaved.id })
          .update({
            products: JSON.stringify(savedProducts),
            updatedAt: new Date()
          });
      }

      return {
        status: true,
        message: 'Product moved to cart successfully !!'
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










}

export default new productService()