import knex from '../common/config/database.config'
import moment from 'moment';
import { Convert } from 'easy-currencies';
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

const cartQtyMap = {};
class cartService {

  async add(authUser, body) {
    try {
      const { products, qty, purityValue, metalId } = body;

      if (!products || !qty || !purityValue || !metalId) {
        return {
          status: false,
          message: 'Product ID, quantity, purity, and metal are required !!'
        };
      }

      const product = await knex('products').where({ id: products }).first();
      if (!product) {
        return {
          status: false,
          message: 'No product found !! '
        };
      }

      let purityArr = [];
      try {
        purityArr = product.purity ? JSON.parse(product.purity) : [];
      } catch {
        purityArr = [];
      }

      const selectedPurity = purityArr.find(p => p.value === purityValue);
      if (!selectedPurity) {
        return { status: false, message: 'Selected purity not available for this product !!' };
      }

      const userId = authUser.id;

      const exists = await knex('cart').where({ userId }).first();
      let cartItems = [];

      if (!exists) {
        cartItems = [
          {
            productId: products,
            qty,
            purityValue,
            metalId,
            price: selectedPurity.profitSellingPrice,
            addedAt: new Date().toISOString()
          }
        ];

        await knex('cart').insert({
          userId,
          products: JSON.stringify(cartItems),
          createdAt: knex.fn.now(),
          updatedAt: knex.fn.now()
        });

        return { status: true, message: 'Product added to cart successfully !!' };
      }

      try {
        cartItems = JSON.parse(exists.products || '[]');
      } catch {
        cartItems = [];
      }

      // Check if same product, purity, and metal exist
      let itemExists = cartItems.find(
        item =>
          item.productId === products &&
          item.purityValue === purityValue &&
          item.metalId === metalId
      );

      if (itemExists) {
        itemExists.qty += qty;
      } else {
        cartItems.push({
          productId: products,
          qty,
          purityValue,
          metalId,
          price: selectedPurity.profitSellingPrice,
          addedAt: new Date().toISOString()
        });
      }

      await knex('cart').where({ id: exists.id }).update({
        products: JSON.stringify(cartItems),
        updatedAt: knex.fn.now()
      });

      return { status: true, message: 'Product added to cart successfully !!' };
    } catch (err) {
      console.error('Add to cart error:', err);
      return { status: false, message: 'Something went wrong !!' };
    }
  }

  async list(authUser, query) {
    try {
      const currency = (query.currency || 'INR').toUpperCase().trim();

      const cartData = await knex('cart').where('userId', authUser.id).first();
      if (!cartData) {
        return {
          status: true,
          message: 'Cart is Empty !!',
          data: { user_id: authUser.id, cart: [] }
        };
      }
      // console.log(cartData,'cartData')

      let cartItemsDb = [];
      try {
        cartItemsDb = JSON.parse(cartData.products || '[]');
      }
      catch (err) {
        console.error("Invalid JSON in cart.products:", cartData.products);
        cartItemsDb = [];
      }
      // console.log("🚀 ~ cartService ~ list ~ cartItemsDb:", cartItemsDb)

      if (!cartItemsDb.length) {
        return { status: true, message: 'Cart is Empty !!', data: { user_id: authUser.id, cart: [] } };
      }

      const productIds = cartItemsDb.map(c => c.productId).filter(id => id != null);
      if (!productIds.length) {
        return { status: true, message: 'Cart is Empty !!', data: { user_id: authUser.id, cart: [] } };
      }

      const products = await knex('products as p')
        .leftJoin('product_images as pi', 'p.id', 'pi.productId')
        .leftJoin('metals as m', 'pi.metalId', 'm.id')
        .whereIn('p.id', productIds)
        .select(
          'p.id',
          'p.title',
          'p.description',
          'p.stockNumber',
          'p.purity',
          'p.estimatedTime',
          'p.shortDescription',
          'pi.image',
          'pi.video',
          'pi.metalId',
          'm.name as metalName'
        );
      // console.log("🚀 ~ cartService ~ list ~ products:", products)

      const baseUrl = process.env.PRODUCT_BASE_URL;
      let conversionRate = 1;
      try {
        if (currency !== 'INR') conversionRate = await Convert(1).from('INR').to(currency);
      } catch {
        conversionRate = 1;
      }
      // console.log(products[0].purity, 'products')
      const productMap = {};
      products.forEach(p => {
        if (!productMap[p.id]) {
          const parsedPurity = p.purity ? JSON.parse(p.purity) : [];
          const purityArr = parsedPurity.map(pr => ({
            value: pr.value,
            name: pr.name,
            profitOriginalPrice: pr.profitoriginalprice ? (Number(pr.profitoriginalprice) * conversionRate).toFixed(2) : null,
            profitSellingPrice: pr.profitsellingprice ? (Number(pr.profitsellingprice) * conversionRate).toFixed(2) : null

          }));

          productMap[p.id] = {
            productId: p.id,
            title: p.title,
            stockNumber: p.stockNumber,
            description: p.description,
            shortDescription: p.shortDescription,
            estimatedTime: p.estimatedTime,
            purity: purityArr,
            media: {}
          };
        }

        const metalKey = p.metalId ? String(p.metalId) : 'default';
        if (!productMap[p.id].media[metalKey]) {
          productMap[p.id].media[metalKey] = {
            id: p.metalId,
            name: p.metalName,
            images: [],
            videos: []
          };
        }

        if (p.image) productMap[p.id].media[metalKey].images.push(...p.image.split(',').map(i => `${baseUrl}/uploads/productmedia/${i.trim()}`));
        if (p.video) productMap[p.id].media[metalKey].videos.push(...p.video.split(',').map(v => `${baseUrl}/uploads/productmedia/${v.trim()}`));
      });
      // console.log("🚀 ~ cartService ~ list ~ products:", products)

      const cartItems = cartItemsDb.map(ci => {
        const product = productMap[ci.productId];
        if (!product) return null;

        const selectedPurity = product.purity.find(p => p.value == ci.purityValue) || product.purity[0];

        let mediaForMetal = product.media[String(ci.metalId)] || product.media['default'] || { images: [], videos: [] };

        const quantity = ci.qty || 1;
        const price = selectedPurity ? Number(selectedPurity.profitSellingPrice || ci.price) : Number(ci.price || 0);
        const totalPrice = (price * quantity).toFixed(2);

        let estimatedDeliveryDate = null;
        if (product.estimatedTime) {
          const match = product.estimatedTime.match(/\d+/g);
          if (match && match.length > 0) {
            const maxDays = Math.max(...match.map(Number));
            const deliveryDate = new Date(ci.addedAt);
            deliveryDate.setDate(deliveryDate.getDate() + maxDays);
            estimatedDeliveryDate = deliveryDate.toISOString().split('T')[0];
          }
        }


        return {
          productId: product.productId,
          title: product.title,
          stockNumber: product.stockNumber,
          description: product.description,
          shortDescription: product.shortDescription,
          estimatedTime: product.estimatedTime,
          purity: selectedPurity,
          metalId: ci.metalId,
          media: mediaForMetal,
          quantity,
          totalPrice,
          addedAt: ci.addedAt,
          estimatedDeliveryDate
        };
      }).filter(Boolean);

      const subtotal = cartItems.reduce((acc, i) => acc + Number(i.totalPrice), 0);
      const totalItems = cartItems.reduce((acc, i) => acc + i.quantity, 0);

      return {
        status: true,
        message: 'Cart fetched successfully!',
        data: {
          user_id: authUser.id,
          cart: cartItems,
          subtotal: subtotal.toFixed(2),
          total: subtotal.toFixed(2),
          items: totalItems
        }
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

  async delete(params, authUser) {
    try {
      const { productId, purityValue, metalId } = params;
      const userId = authUser.id;

      // Validate
      if (!productId || purityValue == null || metalId == null) {
        return {
          status: false,
          message: 'Product ID, purity, and metal are required to delete item!'
        };
      }

      const cart = await knex('cart').where({ userId }).first();
      if (!cart) {
        return {
          status: true,
          message: 'No product found in cart !!'
        };
      }

      let products = JSON.parse(cart.products || '[]');

      // Check if the variant exists
      const exists = products.some(
        p =>
          Number(p.productId) === Number(productId) &&
          Number(p.purityValue) === Number(purityValue) &&
          Number(p.metalId) === Number(metalId)
      );

      if (!exists) {
        return {
          status: false,
          message: 'Product variant not found in cart !!'
        };
      }

      // Remove variant
      products = products.filter(
        p =>
          !(
            Number(p.productId) === Number(productId) &&
            Number(p.purityValue) === Number(purityValue) &&
            Number(p.metalId) === Number(metalId)
          )
      );

      await knex('cart')
        .where({ userId })
        .update({ products: JSON.stringify(products), updatedAt: knex.fn.now() });

      return {
        status: true,
        message: 'Product removed from cart successfully !!'
      };

    } catch (err) {
      console.log('Cart delete error:', err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
    }
  }

  async cartQty(authUser, body) {
    try {
      const { products, qty, purityValue, metalId } = body;

      if (!products || !qty || !purityValue || !metalId) {
        return {
          status: false,
          message: 'Product ID, quantity, purity, and metal are required!'
        };
      }

      const productId = products;
      const userId = authUser.id;

      let cartItems = [];
      const exists = await knex('cart').where({ userId }).first();

      if (!exists) {
        cartItems = [
          {
            productId,
            qty,
            purityValue,
            metalId,
            addedAt: new Date().toISOString()
          }
        ];

        await knex('cart').insert({
          userId,
          products: JSON.stringify(cartItems),
          createdAt: knex.fn.now(),
          updatedAt: knex.fn.now()
        });

        return {
          status: true,
          message: 'Qty added to cart successfully!'
        };
      }

      try {
        cartItems = JSON.parse(exists.products || '[]');
      } catch (err) {
        console.log('Failed to parse cart JSON', err);
        cartItems = [];
      }

      let itemExists = cartItems.find(
        item =>
          item.productId === productId &&
          item.purityValue === purityValue &&
          item.metalId === metalId
      );

      if (itemExists) {
        itemExists.qty = qty;
      } else {
        cartItems.push({
          productId,
          qty,
          purityValue,
          metalId,
          addedAt: new Date().toISOString()
        });
      }

      await knex('cart').where({ id: exists.id }).update({
        products: JSON.stringify(cartItems),
        updatedAt: knex.fn.now()
      });

      return {
        status: true,
        message: 'Qty updated successfully!'
      };
    }
    catch (err) {
      console.log('Cart qty error:', err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
    }
  }

  async orderSummary(productId, authUser, query) {
    try {
      const userId = authUser.id;
      const currency = (query.currency || 'INR').toUpperCase().trim();

      const cartData = await knex('cart').where('userId', userId).first();
      if (!cartData) {
        return {
          status: true,
          message: 'No products found in cart',
          data: { subtotal: 0, Cgst: 0, Igst: 0, deliveryCharge: 0, insuranceCharge: 0, returnCharge: 0, total: 0 }
        };
      }

      let productList = [];
      try {
        productList = JSON.parse(cartData.products || '[]');
      } catch (err) {
        console.error("Invalid JSON in cart.products:", cartData.products);
        productList = [];
      }

      if (!productList.length) {
        return {
          status: true,
          message: 'No products found in cart',
          data: { subtotal: 0, Cgst: 0, Igst: 0, deliveryCharge: 0, insuranceCharge: 0, returnCharge: 0, total: 0 }
        };
      }

      const cartItems = productList.map(item => ({
        productId: Number(item.productId),
        purityValue: Number(item.purityValue),
        metalId: Number(item.metalId),
        qty: Number(item.qty) || 1
      }));

      const productIds = cartItems.map(i => i.productId);


      // if (!productIds.length) {
      //   return {
      //     status: true,
      //     message: 'No products found in cart',
      //     data: { subtotal: 0, Cgst: 0, Igst: 0, deliveryCharge: 0, insuranceCharge: 0, returnCharge: 0, total: 0 }
      //   };
      // }

      const products = await knex('products as p')
        .leftJoin('productMaterial as pm', 'p.id', 'pm.productId')
        .select('p.id', 'p.selling_price', 'p.purity', 'pm.productMaterials')
        .whereIn('p.id', productIds);

      const settings = await knex('settings').first();
      const deliveryCharge = Number(settings?.deliveryCharge) || 0;
      const insuranceCharge = Number(settings?.InsuranceCharge) || 0;
      const returnCharge = Number(settings?.returnCharge) || 0;

      let conversionRate = 1;
      try {
        if (currency !== 'INR') conversionRate = await Convert(1).from('INR').to(currency);
      } catch (err) {
        console.error("Currency conversion failed, defaulting to 1:", err);
      }

      let subtotalCalc = 0;
      let totalGst = 0;

      cartItems.forEach(cartItem => {
        const product = products.find(p => p.id === cartItem.productId);
        if (!product) return;

        const qty = cartItem.qty;

        let parsedPurity = [];
        if (product.purity) {
          try {
            let temp = product.purity;
            while (typeof temp === 'string') temp = JSON.parse(temp);
            parsedPurity = Array.isArray(temp) ? temp : [];
          } catch {
            parsedPurity = [];
          }
        }

        let selectedPurity =
          parsedPurity.find(p => Number(p.value) === Number(cartItem.purityValue)) ||
          parsedPurity[0] ||
          null;

        const price = Number(selectedPurity?.profitsellingprice || product.selling_price || 0);
        const gstRate = 0.03;
        const gstAmount = price * gstRate;

        subtotalCalc += price * qty;
        totalGst += gstAmount * qty;
      });


      const Cgst = totalGst / 2;
      const Igst = totalGst / 2;

      const totalCalc = subtotalCalc + totalGst + deliveryCharge + insuranceCharge;

      const amountPaise = Math.round(totalCalc * 100);
      if (!amountPaise || isNaN(amountPaise) || amountPaise <= 0) {
        return { status: false, message: 'Cannot create payment order: total amount is zero or invalid.' };
      }

      const options = { amount: amountPaise, currency: 'INR' };
      const order = await razorpay.orders.create(options);
      if (!order) return { status: false, message: "Can't generate orderId" };

      const subtotalC = (subtotalCalc * conversionRate).toFixed(2);
      const cgstC = (Cgst * conversionRate).toFixed(2);
      const igstC = (Igst * conversionRate).toFixed(2);
      const deliveryC = (deliveryCharge * conversionRate).toFixed(2);
      const insuranceC = (insuranceCharge * conversionRate).toFixed(2);
      const returnC = (returnCharge * conversionRate).toFixed(2);
      const totalC = (totalCalc * conversionRate).toFixed(2);

      const user = await knex('users')
        .select('email', 'mobile_Number', 'name')
        .where('id', userId)
        .first();

      const userEmail = user?.email || null;
      const userMobile = user?.mobile_Number || null;
      const name = user?.name || null;

      return {
        status: true,
        message: 'Order summary fetched successfully',
        data: {
          subtotal: subtotalC,
          Cgst: cgstC,
          Igst: igstC,
          deliveryCharge: deliveryC,
          insuranceCharge: insuranceC,
          returnCharge: returnC,
          total: totalC
        },
        orderId: order.id,
        user: {
          email: userEmail,
          mobile: userMobile,
          name: name
        }
      };

    } catch (err) {
      console.error('Order summary error:', err);
      if (
        err?.error?.code === 'BAD_REQUEST_ERROR' &&
        err?.error?.description?.toLowerCase().includes('amount exceeds')
      ) {
        return {
          status: false,
          message: 'Order amount exceeds the maximum limit allowed. Please reduce cart value and try again.'
        };
      }
      return { status: false, message: 'Something went wrong !!' };
    }
  }













}

export default new cartService()