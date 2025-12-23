import knex from '../common/config/database.config'
import Razorpay from 'razorpay';
import path from 'path'
import fs from 'fs'
import CurrencyConverter from 'currency-converter-lt'
import { sendOrderPlacedEmail } from '../common/config/nodemailer.config'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

class paymentService {

  async fetch(body, authUser) {
    try {
      const { paymentId } = body;
      console.log("🚀 ~ paymentService ~ fetch ~ body:", body)
      const userId = authUser.id;

      if (!paymentId) {
        return {
          status: false,
          message: "PaymentId is required !!",
        };
      }


      const capturedata = await razorpay.payments.fetch(paymentId);
      console.log("Capture Data Status:", capturedata.status);
      console.log("Full Capture Data:", capturedata);

      if (!capturedata) {
        return {
          status: false,
          message: "Payment can't be fetched !!",
        };
      }

      if (capturedata.status === "failed") {
        return {
          status: false,
          message: "Payment failed",
        };
      }

      if (!["captured", "authorized"].includes(capturedata.status)) {
        return {
          status: false,
          message: "Payment not completed yet",
        }
      }
      const cartData = await knex("cart").where("userId", userId).first();
      if (!cartData) {
        return {
          status: false,
          message: "No products in cart !!",
        };
      }

      const productList = JSON.parse(cartData.products);
      const productIds = productList.map((p) => p.products || p.productId);

      const products = await knex("products")
        .whereIn("id", productIds)
        .select("id", "purity");

      // console.log(products, 'products');


      const settings = await knex("settings").first();

      const deliveryCharge = settings?.deliveryCharge ? Number(settings.deliveryCharge) : 0;
      const insuranceCharge = settings?.InsuranceCharge ? Number(settings.InsuranceCharge) : 0;
      const returnCharge = settings?.returnCharge ? Number(settings.returnCharge) : 0;

      // console.log("Charges:", { deliveryCharge, insuranceCharge, returnCharge });

      let subtotal = 0;

      for (const item of productList) {
        const product = products.find(p => p.id === (item.products || item.productId));

        if (!product) {
          console.warn(`Product not found for item:`, item);
          continue;
        }

        // console.log(`Processing productId: ${product.id}, itemQty: ${item.qty || item.quantity || 1}`);


        if (product.purity) {
          let purityAll = [];
          try {
            let temp = product.purity;
            while (typeof temp === "string") temp = JSON.parse(temp);
            purityAll = Array.isArray(temp) ? temp : [];
          } catch (err) {
            console.warn("Purity parse error:", err.message);
          }

          // console.log(`Available purities:`, purityAll);

          const selectedPurity = purityAll.find(pr => String(pr.value) === String(item.purityValue)) || purityAll[0];

          if (!selectedPurity) {
            console.warn("No matching purity found, skipping item:", item);
            continue;
          }

          // console.log("Selected Purity:", selectedPurity);

          const itemQty = Number(item.qty || item.quantity || 1);
          const itemPrice = Number(selectedPurity.profitSellingPrice || selectedPurity.profitsellingprice || 0);

          // console.log(`Item Price: ${itemPrice}, Quantity: ${itemQty}`);

          item.price = itemPrice;
          item.subtotal = itemPrice * itemQty;
          item.status = "Pending";
          item.isPdf = false

          subtotal += item.subtotal;
          // console.log(`Running Subtotal: ${subtotal}`);
        } else {
          console.warn("Product has no purity:", product.id);
        }
      }

      // console.log("🚀 ~ paymentService ~ fetch ~ productList:", productList)

      const TOTAL_GST_RATE = 0.03;
      const CGST_RATE = TOTAL_GST_RATE / 2;
      const IGST_RATE = TOTAL_GST_RATE / 2;

      const cgst = subtotal * CGST_RATE;
      const igst = subtotal * IGST_RATE;
      const totalgst = cgst + igst;

      // console.log(`CGST: ${cgst}, IGST: ${igst}, Total GST: ${totalgst}`);

      const total = subtotal + totalgst + deliveryCharge + insuranceCharge;
      // console.log(`Total Amount: ${total}`);

      const paymentDetails = {
        subtotal: subtotal.toFixed(2),
        cgst: cgst.toFixed(2),
        igst: igst.toFixed(2),
        totalgst: totalgst.toFixed(2),
        deliveryCharge: deliveryCharge.toFixed(2),
        insuranceCharge: insuranceCharge.toFixed(2),
        returnCharge: returnCharge.toFixed(2),
        total: total.toFixed(2),
      };

      // console.log("Final Payment Details:", paymentDetails);


      let count = 1;

      // Fetch last counter row
      const checkLastCount = await knex("order_counter")
        .where({ name: 'order' })
        .first();

      // console.log("checkLastCount:", checkLastCount);

      // If no record found → insert first record
      if (!checkLastCount) {
        await knex("order_counter").insert({ name: 'order', count: "1" });
        count = 1;
      } else {
        // Convert DB string count → number
        count = Number(checkLastCount.count) + 1;
        // console.log("Next count:", count);

        // Save new count back as STRING
        await knex("order_counter")
          .where({ name: 'order' })
          .update({ count: count.toString() });
      }

      // Function to pad ID
      function generateOrderId(num) {
        return String(num).padStart(6, "0");
      }

      const randomOrderId = generateOrderId(count);

      // const randomOrderId = "#" + Math.floor(100000 + Math.random() * 900000);
      // const randomOrderId = generateOrderId(Number(count));
      // console.log("🚀 ~ paymentService ~ fetch ~ randomOrderId:", randomOrderId)

      const [id] = await knex("orders").insert({
        userId,
        products: JSON.stringify(productList),
        orderId: randomOrderId,
        razorpayOrderId: capturedata.order_id,
        razorpayPaymentId: capturedata.id,
        razorpayDetail: JSON.stringify(capturedata),
        paymentDetails: JSON.stringify(paymentDetails),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await knex("cart").where("userId", userId).del();

      // const user = await knex("users").where("id", userId).first();
      // if (user?.email) {
      //   await sendOrderPlacedEmail({
      //     to: user.email,
      //     customerName: user.name,
      //     orderDetails: {
      //       orderId: randomOrderId,
      //       amount: total
      //     }
      //   });

      // }



      return {
        status: true,
        message: "Payment verified & order created successfully !!",
        data: {
          id,
          orderId: randomOrderId,
          razorpay_payment_id: capturedata.id,
          total,
          capturedata
        },
      };
    }
    catch (err) {
      console.log(err);
      return {
        status: false,
        message: "Something went wrong !!",
      };
    }
  }
  // async fetch(body, authUser) {
  //   try {
  //     const userId = authUser.id;


  //     const cartData = await knex("cart").where("userId", userId).first();
  //     if (!cartData) {
  //       return {
  //         status: false,
  //         message: "No products in cart !!"
  //       };
  //     }

  //     const productList = JSON.parse(cartData.products || "[]");
  //     if (!productList.length) {
  //       return {
  //         status: false,
  //         message: "No products in cart !!"
  //       };
  //     }

  //     const productIds = productList.map((p) => p.products || p.productId);

  //     const products = await knex("products")
  //       .whereIn("id", productIds)
  //       .select("id", "purity");

  //     let subtotal = 0;

  //     const orderProducts = productList.map((item) => {
  //       const product = products.find(
  //         (p) => p.id === (item.products || item.productId)
  //       );

  //       let selectedPurity = null;
  //       if (product) {
  //         try {
  //           const purityArr = product.purity ? JSON.parse(product.purity) : [];
  //           selectedPurity =
  //             purityArr.find(
  //               (p) => String(p.value) === String(item.purityValue)
  //             ) || purityArr[0];
  //         } catch {
  //           selectedPurity = null;
  //         }
  //       }

  //       const price = selectedPurity?.profitsellingprice
  //         ? Number(selectedPurity.profitsellingprice)
  //         : 0;
  //       const qty = Number(item.qty || 1);
  //       const subtotalItem = price * qty;

  //       subtotal += subtotalItem;

  //       return {
  //         productId: item.products || item.productId,
  //         metalId: item.metalId || null,
  //         purityValue: item.purityValue || null,
  //         qty,
  //         price,
  //         subtotal: subtotalItem,
  //         status: "Pending",
  //         addedAt: item.addedAt || new Date(),
  //       };
  //     });

  //     const settings = await knex("settings").first();
  //     const deliveryCharge = settings?.deliveryCharge ? Number(settings.deliveryCharge) : 0;
  //     const insuranceCharge = settings?.InsuranceCharge ? Number(settings.InsuranceCharge) : 0;
  //     const returnCharge = settings?.returnCharge ? Number(settings.returnCharge) : 0;

  //     const total = subtotal + deliveryCharge + insuranceCharge;

  //     const randomOrderId = "#" + Math.floor(100000 + Math.random() * 900000);

  //     const [id] = await knex("orders").insert({
  //       userId,
  //       orderId: randomOrderId,
  //       products: JSON.stringify(orderProducts),
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //     });

  //     await knex("cart").where("userId", userId).del();

  //     return {
  //       status: true,
  //       message: "Order created successfully !!",
  //       data: {
  //         id,
  //         userId,
  //         orderId: randomOrderId,
  //         createdAt: new Date(),
  //         updatedAt: new Date(),
  //         total
  //       },
  //     };
  //   } catch (err) {
  //     console.error("Order fetch error:", err);
  //     return { status: false, message: "Something went wrong !!" };
  //   }
  // }





}

export default new paymentService();