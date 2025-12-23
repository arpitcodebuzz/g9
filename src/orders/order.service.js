import knex from '../common/config/database.config'
import { Convert } from 'easy-currencies';
import { uploadToS3 } from "../common/config/awsBucket.config";
import { generatePDF } from '../common/utils/pdfGenerator'
import { sendOrderPlacedEmail } from '../common/config/nodemailer.config'
import { sendWhatsappInvoicePDF } from '../twilio/whatsapp.otp';
import Twilio from 'twilio';

const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);


class orderService {

  async list(authUser, statusFilter, query) {
    try {
      const { perPage, page, currency } = query;
      const baseUrl = process.env.PRODUCT_BASE_URL;

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

      const qb = knex("orders")
        .where("userId", authUser.id)
        .orderBy("createdAt", "desc");

      const data = await qb.paginate({
        perPage: perPage ? parseInt(perPage) : 10,
        currentPage: page ? parseInt(page) : 1,
        isLengthAware: true,
      });

      if (!data.data || data.data.length === 0) {
        return {
          status: true,
          message: "No orders found",
          data: { user_id: authUser.id, orders: [] },
        };
      }

      const orders = [];

      for (const order of data.data) {
        const orderProducts = JSON.parse(order.products || "[]");
        const productIds = orderProducts
          .map((p) => p.productId)
          .filter(id => id !== undefined && id !== null);

        if (!productIds.length) continue;

        const products = await knex
          .from("products as p")
          .leftJoin("product_images as pi", "p.id", "pi.productId")
          .leftJoin("metals as m", "pi.metalId", "m.id")
          .whereIn("p.id", productIds)
          .select(
            "p.id",
            "p.title",
            "p.stockNumber",
            "p.purity",
            "pi.image",
            "pi.video",
            "pi.metalId",
            "m.name as metalName"
          );

        const items = orderProducts.map((p) => {
          const product = products.find((prod) => prod.id === p.productId);

          let purityArr = [];
          let gstAmount = 0;
          let price = 0;

          if (product?.purity) {
            try {
              const purityAll = JSON.parse(product.purity);
              const selectedPurity = purityAll.find(pr => String(pr.value) === String(p.purityValue));

              if (selectedPurity) {
                const originalPrice = parseFloat(selectedPurity.profitoriginalprice) || 0;
                const sellingPrice = parseFloat(selectedPurity.profitsellingprice) || 0;
                const gst = parseFloat(selectedPurity.gstAmount) || 0;

                price = convertCurrency ? sellingPrice * conversionRate : sellingPrice;
                gstAmount = convertCurrency ? gst * conversionRate : gst;

                purityArr.push({
                  value: selectedPurity.value,
                  name: selectedPurity.name,
                  profitoriginalprice: convertCurrency ? (originalPrice * conversionRate).toFixed(2) : originalPrice.toFixed(2),
                  profitsellingprice: convertCurrency ? (sellingPrice * conversionRate).toFixed(2) : sellingPrice.toFixed(2)
                });
              }
            } catch (err) {
              console.warn("Purity parse error:", err.message);
            }
          }

          const mediaMap = {};
          const productRows = products.filter(prod => prod.id === p.productId);

          productRows.forEach(r => {
            if (!r.metalId) return;

            if (!mediaMap[r.metalId]) {
              mediaMap[r.metalId] = { id: r.metalId, name: r.metalName, images: [], videos: [] };
            }

            if (r.image) {
              r.image.split(',').forEach(img =>
                mediaMap[r.metalId].images.push(`${baseUrl}/uploads/productmedia/${img.trim()}`)
              );
            }

            if (r.video) {
              r.video.split(',').forEach(v =>
                mediaMap[r.metalId].videos.push(`${baseUrl}/uploads/productmedia/${v.trim()}`)
              );
            }
          });

          const media = mediaMap[p.metalId] ? [mediaMap[p.metalId]] : [];
          const totalPrice = price * (p.qty || 1);

          return {
            productId: p.productId,
            title: product?.title || "",
            quantity: p.qty,
            stockNumber: product?.stockNumber || "",
            price: price.toFixed(2),
            totalPrice: totalPrice.toFixed(2),
            status: p.status,
            addedAt: p.addedAt,
            orderId: order.orderId,
            paymentId: order.razorpayPaymentId,
            purity: purityArr,
            media,
            gstAmount: gstAmount.toFixed(2),
            currency: selectedCurrency
          };
        });

        const statuses = items.map(i => i.status);
        const uniqueStatuses = [...new Set(statuses.map(s => s?.toLowerCase()))];

        let orderStatus = 'Pending';

        const allDelivered = uniqueStatuses.every(s => s === 'delivered');
        const anyPendingOrProcessing = uniqueStatuses.some(s =>
          ['pending', 'Queued', 'on-processing', 'on the way'].includes(s)
        );

        if (allDelivered) {
          orderStatus = 'Delivered';
        } else if (anyPendingOrProcessing) {
          orderStatus = 'Pending';
        } else {
          orderStatus = 'Pending';
        }

        let paymentDetails = {};

        try {
          paymentDetails = JSON.parse(order.paymentDetails || "{}");
        } catch (error) {
          console.log("Error parsing paymentDetails:", error.message);
        }

        if (convertCurrency && paymentDetails.currency && paymentDetails.total) {
          const fieldsToConvert = [
            "subtotal",
            "cgst",
            "igst",
            "totalgst",
            "deliveryCharge",
            "insuranceCharge",
            "returnCharge",
            "total"
          ];

          for (const field of fieldsToConvert) {
            if (paymentDetails[field] !== undefined) {
              paymentDetails[field] = (Number(paymentDetails[field]) * conversionRate).toFixed(2);
            }
          }

          paymentDetails.currency = selectedCurrency;
        }
        orders.push({
          id: order.id,
          userId: order.userId,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          status: orderStatus,
          items,
          paymentDetails,
        });
      }

      const filteredOrders = statusFilter
        ? orders.filter((order) => order.status.toLowerCase() === statusFilter.toLowerCase())
        : orders;

      return {
        status: true,
        message: "Orders fetched successfully!",
        data: { user_id: authUser.id, orders: filteredOrders },
        pagination: data.pagination,
      };
    } catch (err) {
      console.error("Order list error:", err);
      return { status: false, message: "Something went wrong !!" };
    }
  }

  async addressDetail(body, authUser) {
    try {
      const { name, GstNumber, userAddressId, id } = body
      const userId = authUser.id
      // console.log(userId)

      await knex('orders')
        .where({ id })
        .update({
          name: name,
          GstNumber: GstNumber,
          userAddressId
        });

      return {
        status: true,
        message: 'Address added successfully !!'
      }
    }
    catch (err) {
      console.log(err)
      return {
        status: false,
        message: 'Something went wrong !!'
      }
    }
  }

  async details(authUser, params) {
    try {
      const { orderId } = params
      const order = await knex('orders')
        .where({ id: orderId, userId: authUser.id })
        .first();
      // console.log(order, 'order')

      if (!order) {
        return { status: true, message: 'Order not found' };
      }

      const baseUrl = process.env.PRODUCT_BASE_URL;

      let parsedProducts = [];
      try {
        parsedProducts = JSON.parse(order.products || "[]");
      } catch {
        parsedProducts = [];
      }

      const productIds = parsedProducts.map(p => p.products).filter(Boolean);
      let orderItems = [];

      if (productIds.length > 0) {
        const data = await knex('products')
          .whereIn('products.id', productIds)
          .leftJoin('product_images', 'products.id', 'product_images.productId')
          .select(
            'products.id',
            'products.title',
            'products.stockNumber',
            'products.selling_price',
            'product_images.image as product_image'
          )
          .orderBy('products.createdAt', 'desc');
        console.log(data)

        orderItems = data.map(row => {
          const productData = parsedProducts.find(p => p.products === row.id);
          const qty = productData?.qty || 1;
          // console.log(orderItems)

          return {
            productId: row.id,
            title: row.title,
            selling_price: row.selling_price,
            stockNumber: row.stockNumber || "",
            quantity: qty,
            status: productData?.status || "pending",
            addedAt: productData?.addedAt || null,
            totalPrice: row.selling_price * qty,
            orderId: order.orderId,
            images: row.product_image
              ? row.product_image.split(',').map(img => `${baseUrl}/uploads/productmedia/${img.trim()}`)
              : []
          };
        });
      }

      const subtotal = orderItems.reduce((acc, item) => acc + (item.totalPrice || 0), 0);
      const GST_RATE = 0.18;
      const gst = subtotal * GST_RATE;
      const total = subtotal + gst;

      return {
        status: true,
        message: 'Order fetched successfully!',
        data: {
          id: order.id,
          orderId: order.orderId,
          userId: order.userId,
          items: orderItems,
          paymentDetails: { subtotal, gst, total }
        }
      };

    }
    catch (err) {
      console.error("Order detail error:", err);
      return { status: false, message: 'Something went wrong !!' };
    }
  }

  async Cancelled(body) {
    try {
      const { orderId } = body;

      const order = await knex('orders')
        .where({ id: orderId })
        .first();

      if (!order) {
        return {
          status: false,
          message: 'Order not found!'
        };
      }

      let parsedProducts = [];
      try {
        parsedProducts = JSON.parse(order.products || "[]");
      } catch (err) {
        console.error("Invalid product JSON");
        return {
          status: false,
          message: 'Invalid product data !'
        };
      }

      const hasDelivered = parsedProducts.some(p => p.status === "Delivered");

      if (hasDelivered) {
        return {
          status: false,
          message: 'Order cannot be cancelled because some products are already delivered.'
        };
      }

      const updatedProducts = parsedProducts.map(p => ({
        ...p,
        status: "Cancelled"
      }));

      await knex('orders')
        .where({ id: orderId })
        .update({
          products: JSON.stringify(updatedProducts),
          updatedAt: knex.fn.now()
        });

      return {
        status: true,
        message: 'Order cancelled successfully!'
      };
    }
    catch (err) {
      console.error("Cancel order error:", err);
      return {
        status: false,
        message: 'Something went wrong while cancelling the order!'
      };
    }
  }

  async alldetails(params, query) {
    try {
      const { orderId } = params;
      const currency = (query?.currency || 'INR').toUpperCase().trim();
      const baseUrl = process.env.PRODUCT_BASE_URL;

      let conversionRate = 1;
      let convertCurrency = false;
      if (currency !== 'INR') {
        try {
          conversionRate = await Convert(1).from('INR').to(currency);
          convertCurrency = true;
        } catch (err) {
          console.warn(`Currency conversion failed: ${err.message}`);
          conversionRate = 1;
        }
      }

      const order = await knex('orders').where({ id: orderId }).first();
      if (!order) return {
        status: false,
        message: 'Order not found !!'
      };

      const user = await knex('users').where({ id: order.userId }).first();

      let address = null;
      if (order.userAddressId) {
        address = await knex('user_address').where({ id: order.userAddressId }).first();
      }

      let parsedProducts = [];
      try {
        parsedProducts = JSON.parse(order.products || '[]');
      } catch { parsedProducts = []; }

      const productIds = [...new Set(parsedProducts.map(p => Number(p.productId)).filter(Boolean))];

      let orderItems = [];
      if (productIds.length) {
        const products = await knex('products as p')
          .whereIn('p.id', productIds)
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
          );

        orderItems = parsedProducts.map(item => {
          const product = products.find(p => p.id === item.productId);
          if (!product) return null;

          let selectedPurity = null;
          if (product.purity) {
            try {
              const purityAll = JSON.parse(product.purity);
              selectedPurity = purityAll.find(p => Number(p.value) === Number(item.purityValue));
            } catch { }
          }

          const originalPrice = parseFloat(selectedPurity?.profitoriginalprice || 0);
          const sellingPrice = parseFloat(selectedPurity?.profitsellingprice || 0);
          const gstAmountRaw = parseFloat(selectedPurity?.gstAmount || 0);
          const qty = Number(item.qty || 1);

          const price = convertCurrency ? sellingPrice * conversionRate : sellingPrice;
          const gstAmount = convertCurrency ? gstAmountRaw * conversionRate : gstAmountRaw;
          const totalPrice = price * qty;

          const mediaMap = {};
          const productRows = products.filter(prod => prod.id === item.productId);
          productRows.forEach(r => {
            if (!r.metalId) return;
            if (!mediaMap[r.metalId]) {
              mediaMap[r.metalId] = { id: r.metalId, name: r.metalName, images: [], videos: [] };
            }
            if (r.image) r.image.split(',').forEach(img => mediaMap[r.metalId].images.push(`${baseUrl}/uploads/productmedia/${img.trim()}`));
            if (r.video) r.video.split(',').forEach(v => mediaMap[r.metalId].videos.push(`${baseUrl}/uploads/productmedia/${v.trim()}`));
          });

          const media = mediaMap[item.metalId] ? [mediaMap[item.metalId]] : [];

          return {
            productId: product.id,
            title: product.title,
            stockNumber: product.stockNumber || "",
            quantity: qty,
            price: price.toFixed(2),
            subtotal: totalPrice.toFixed(2),
            status: item.status || 'Pending',
            purity: selectedPurity
              ? {
                value: selectedPurity.value,
                name: selectedPurity.name,
                profitoriginalprice: convertCurrency ? (originalPrice * conversionRate).toFixed(2) : originalPrice.toFixed(2),
                profitsellingprice: convertCurrency ? (sellingPrice * conversionRate).toFixed(2) : sellingPrice.toFixed(2)
              }
              : null,
            media,
            gstAmount: gstAmount.toFixed(2),
            currency
          };
        }).filter(Boolean);
      }

      const statuses = orderItems.map(i => (i.status || 'Pending').toLowerCase());
      const uniqueStatuses = [...new Set(statuses)];

      let orderStatus = 'Pending';

      const allDelivered = uniqueStatuses.every(s => s === 'delivered');
      const anyPendingOrProcessing = uniqueStatuses.some(s =>
        ['pending', 'Queued', 'on-processing', 'on the way'].includes(s)
      );

      if (allDelivered) {
        orderStatus = 'Delivered';
      } else if (anyPendingOrProcessing) {
        orderStatus = 'Pending';
      } else {
        orderStatus = 'Pending';
      }


      let paymentDetails = {};
      try {
        paymentDetails = JSON.parse(order.paymentDetails || "{}");
      } catch (error) {
        console.log("Error parsing paymentDetails:", error.message);
      }

      if (convertCurrency) {
        const fieldsToConvert = [
          "subtotal",
          "cgst",
          "igst",
          "totalgst",
          "deliveryCharge",
          "insuranceCharge",
          "returnCharge",
          "total"
        ];

        for (const field of fieldsToConvert) {
          if (paymentDetails[field] !== undefined) {
            paymentDetails[field] = (Number(paymentDetails[field]) * conversionRate).toFixed(2);
          }
        }

        paymentDetails.currency = currency;
      }

      const invoiceRows = await knex('invoices').select('orderId', 'invoice');
      const invoiceMap = {};
      invoiceRows.forEach(inv => {
        invoiceMap[String(inv.orderId)] = inv.invoice;
      });

      const invoiceUrl = invoiceMap[String(order.id)]
        ? `${baseUrl}/uploads/invoice/${invoiceMap[String(order.id)]}`
        : null;

      // console.log(invoiceUrl, 'invoiceUrl');


      return {
        status: true,
        message: 'Order details fetched successfully!',
        data: {
          id: order.id,
          orderId: order.orderId,
          createdAt: order.createdAt,
          paymentId: order.razorpayPaymentId,
          status: orderStatus,
          gstDetails: { name: order.name, GstNumber: order.GstNumber },
          user: user ? { id: user.id, name: user.name, email: user.email } : null,
          address,
          items: orderItems,
          paymentDetails,
          razorpayDetail: order.razorpayDetail ? JSON.parse(order.razorpayDetail) : null,
          invoice: invoiceUrl
        }
      };

    } catch (err) {
      console.error("Order details error:", err);
      return { status: false, message: 'Something went wrong !!' };
    }
  }




  // async generateInvoice(user, body, orderId, file) {
  //   const order = await knex("orders as o")
  //     .leftJoin("users as u", "o.userId", "u.id")
  //     .select("o.*", "u.name as userName", "u.email as userEmail")
  //     .where("o.id", orderId)
  //     .first();

  //   if (!order) return { status: false, message: "Order not found" };

  //   // Parse products
  //   let orderItems = [];
  //   try {
  //     orderItems = JSON.parse(order.products || "[]");
  //   } catch (err) {
  //     console.error(`Error parsing products for order ${orderId}:`, err.message);
  //     return { status: false, message: "Invalid product data in order" };
  //   }


  //   const totalAmount = orderItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);

  //   // Generate HTML for PDF
  //   const htmlContent = `
  //   <html>
  //     <head>
  //       <style>
  //         body { font-family: Arial, sans-serif; margin: 20px; }
  //         h1 { text-align: center; }
  //         table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  //         th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
  //         th { background-color: #f2f2f2; }
  //         .total { text-align: right; font-weight: bold; margin-top: 10px; }
  //       </style>
  //     </head>
  //     <body>
  //       <h1>Main Invoice</h1>
  //       <p>Order ID: ${order.orderId}</p>
  //       <p>Customer: ${order.userName} (${order.userEmail})</p>
  //       <table>
  //         <thead>
  //           <tr>
  //             <th>#</th>
  //             <th>Product</th>
  //             <th>Quantity</th>
  //             <th>Price</th>
  //             <th>Subtotal</th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           ${orderItems.map((item, index) => `
  //             <tr>
  //               <td>${index + 1}</td>
  //               <td>${item.title}</td>
  //               <td>${item.quantity}</td>
  //               <td>₹${item.price}</td>
  //               <td>₹${item.subtotal}</td>
  //             </tr>
  //           `).join("")}
  //         </tbody>
  //       </table>
  //       <div class="total">Total Amount: ₹${totalAmount.toFixed(2)}</div>
  //     </body>
  //   </html>
  // `;

  //   const invoiceId = `INV-MAIN-${order.id}`;
  //   const fileName = `invoice-main-${order.id}.pdf`;

  //   // Generate PDF using Puppeteer
  //   await generatePDF(htmlContent, fileName);

  //   // Insert into invoices table
  //   await knex("invoices").insert({
  //     orderId: order.orderId,
  //     invoiceId,
  //     invoice: fileName,
  //   });

  //   return { status: true, message: "Invoice generated successfully", invoiceFile: fileName };
  // }


  //   async createInvoice(body) {
  //     try {
  //       const { id } = body;

  //       if (!id) {
  //         return { status: false, message: "Order id is required" };
  //       }

  //       const order = await knex("orders").where("id", id).first();

  //       if (!order) {
  //         return { status: false, message: "Order not found" };
  //       }

  //       let orderProducts = [];
  //       try {
  //         orderProducts = JSON.parse(order.products || "[]");
  //       } catch (err) {
  //         orderProducts = [];
  //       }

  //       const productIds = orderProducts.map(p => Number(p.productId)).filter(Boolean);

  //       const dbProducts = await knex('products')
  //         .whereIn('id', productIds)
  //         .select('id', 'title');

  //       let productRows = "";
  //       orderProducts.forEach((item, i) => {
  //         const product = dbProducts.find(p => p.id === Number(item.productId));
  //         productRows += `
  //     <tr>
  //       <td style="border:1px solid #999;padding:8px;">${i + 1}</td>
  //       <td style="border:1px solid #999;padding:8px;">${product?.title || "N/A"}</td>
  //       <td style="border:1px solid #999;padding:8px;">${item.quantity || 1}</td>
  //       <td style="border:1px solid #999;padding:8px;">₹${item.price || 0}</td>
  //     </tr>
  //   `;
  //       });


  //       let paymentDetails = {};
  //       try {
  //         paymentDetails = JSON.parse(order.paymentDetails || "{}");
  //       } catch (err) {
  //         paymentDetails = {};
  //       }

  //       let paymentHtml = `
  //   <p><strong>Razorpay Order ID:</strong> ${order.razorpayOrderId || "N/A"}</p>
  //   <p><strong>Razorpay Payment ID:</strong> ${order.razorpayPaymentId || "N/A"}</p>
  //   <p><strong>User Address ID:</strong> ${order.userAddressId || "N/A"}</p>
  // `;

  //       Object.keys(paymentDetails).forEach(key => {
  //         paymentHtml += `<p><strong>${key}:</strong> ${paymentDetails[key]}</p>`;
  //       });

  //       const html = `
  // <html>
  //   <body style="font-family: Arial; padding: 20px;">
  //     <h1>Invoice</h1>
  //     <p><strong>Order ID:</strong> ${order.orderId}</p>
  //     <p><strong>User ID:</strong> ${order.userId}</p>
  //     <p><strong>Name:</strong> ${order.name || "N/A"}</p>
  //     <p><strong>GST Number:</strong> ${order.GstNumber || "N/A"}</p>
  //     <p><strong>Order Created:</strong> ${new Date(order.createdAt).toLocaleString()}</p>

  //     <h2>Products</h2>
  //     <table style="width:100%;border-collapse:collapse;">
  //       <thead>
  //         <tr>
  //           <th style="border:1px solid #999;padding:8px;">#</th>
  //           <th style="border:1px solid #999;padding:8px;">Product</th>
  //           <th style="border:1px solid #999;padding:8px;">Qty</th>
  //           <th style="border:1px solid #999;padding:8px;">Price</th>
  //         </tr>
  //       </thead>
  //       <tbody>
  //         ${productRows}
  //       </tbody>
  //     </table>

  //     <h2>Payment Details</h2>
  //     ${paymentHtml}
  //   </body>
  // </html>
  // `;


  //       const invoiceId = order.orderId;
  //       const fileName = invoiceId.replace(/[^a-zA-Z0-9-_]/g, "") + ".pdf";

  //       await generatePDF(html, fileName);

  //       await knex("invoices").insert({
  //         orderId: order.id,
  //         invoiceId: invoiceId,
  //         invoice: fileName
  //       });

  //       return {
  //         status: true,
  //         message: "Invoice generated successfully",
  //         invoiceId,
  //         invoice: fileName,
  //         path: `/uploads/invoice/${fileName}`
  //       };

  //     } catch (error) {
  //       return {
  //         status: false,
  //         message: error.message
  //       };
  //     }
  //   }

  async createInvoice(body) {
    try {
      const { id } = body;

      if (!id) {
        return {
          status: false,
          message: "Order id is required"
        };
      }

      const order = await knex("orders").where("id", id).first();
      if (!order) {
        return { status: false, message: "Order not found" };
      }
      // console.log("🚀 ~ orderService ~ createInvoice ~ order:", order)

      let orderProducts = [];
      try {
        orderProducts = JSON.parse(order.products || "[]");
        if (!Array.isArray(orderProducts)) orderProducts = [];
      } catch (err) {
        orderProducts = [];
      }

      // console.log("Order Products:", orderProducts);

      const productIds = orderProducts.map(p => Number(p.productId)).filter(Boolean);

      let dbProducts = [];
      if (productIds.length) {
        dbProducts = await knex("products")
          .whereIn("id", productIds)
          .select("id", "title", "stockNumber");
      }

      const purityIds = orderProducts.map(p => p.purityValue).filter(Boolean);
      const metalIds = orderProducts.map(p => p.metalId).filter(Boolean);

      let purityList = [];
      if (purityIds.length) {
        purityList = await knex("goldPurity")
          .whereIn("id", purityIds)
          .select("id", "name");
      }

      let metalList = [];
      if (metalIds.length) {
        metalList = await knex("metals")
          .whereIn("id", metalIds)
          .select("id", "name");
      }

      let productRows = "";
      orderProducts.forEach(item => {
        const product = dbProducts.find(p => p.id === Number(item.productId));

        const title = product?.title || "N/A";
        const stockNumber = product?.stockNumber || "N/A";
        const purity = purityList.find(p => p.id === item.purityValue)?.name || "N/A";
        // console.log("🚀 ~ orderService ~ createInvoice ~ purity:", purity)
        const color = metalList.find(m => m.id === item.metalId)?.name || "N/A";
        // console.log("🚀 ~ orderService ~ createInvoice ~ color:", color)

        const qty = item.qty ?? 1;
        const price = item.price ?? 0;

        productRows += `
    <tr>
      <td>${stockNumber}</td>
      <td>${purity}</td>
      <td>${color}</td>
      <td class="text-center">${qty}</td>
      <td class="text-right">₹${Number(price).toFixed(2)}</td>
    </tr>
  `;
      });

      // console.log("Final productRows:", productRows);

      let paymentDetails = {};
      try {
        paymentDetails = JSON.parse(order.paymentDetails || "{}") || {};
      } catch (err) {
        paymentDetails = {};
      }
      const subtotal = paymentDetails.subtotal ?? paymentDetails.sub_total ?? paymentDetails.amount ?? 0;
      const shipping_fee = paymentDetails.deliveryCharge ?? paymentDetails.deliveryCharge ?? 0;
      const insurance_fee = paymentDetails.insuranceCharge ?? paymentDetails.insuranceCharge ?? 0;
      const returnCharge = paymentDetails.returnCharge ?? paymentDetails.returnCharge ?? 0;
      const cgst = paymentDetails.cgst ?? 0;
      const igst = paymentDetails.igst ?? 0;
      const totalAmount = paymentDetails.total ?? paymentDetails.amount_total ?? subtotal;

      let razorpay = {};
      try {
        razorpay = JSON.parse(order.razorpayDetail || "{}") || {};
      } catch (err) {
        razorpay = {};
      }
      const razorpayPaymentId = order.razorpayPaymentId || razorpay.razorpay_payment_id || razorpay.payment_id || razorpay.pay_id || "N/A";
      const razorpayOrderId = order.razorpayOrderId || razorpay.razorpay_order_id || razorpay.order_id || "N/A";
      const razorpayMethod = razorpay.method || razorpay.payment_method || paymentDetails.method || "N/A";
      const razorpayCardLast4 = (razorpay.card?.last4) || razorpay.card_last4 || razorpay.card_last4_digits || "";

      const user = await knex("users").where("id", order.userId).first();
      const userName = user?.name || "N/A";
      const userPhone = user?.Mobile_number || "N/A";
      const userEmail = user?.email || "N/A";
      const gstName = order.name ? order.name : '-'
      const GstNumber = order.GstNumber ? order.GstNumber : '-'

      let shipping = null;
      if (order.userAddressId) {
        shipping = await knex("user_address").where("id", order.userAddressId).first();
      }
      if (!shipping && order.userId) {
        shipping = await knex("user_address").where("userId", order.userId).orderBy("id", "desc").first();
      }
      const addressType = shipping?.address_type || shipping?.address_type || "N/A";
      const addressLine1 = shipping?.address_line_1 || shipping?.address || "";
      const addressLine2 = shipping?.address_line_2 || shipping?.addressLine || "";
      const city = shipping?.city || "";
      const state = shipping?.state || "";
      const country = shipping?.country || "";
      const pincode = shipping?.postal_code || shipping?.postal_code || "";

      const orderDateDisplay = new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      const transactionDateDisplay = paymentDetails.transaction_date
        ? new Date(paymentDetails.transaction_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : (order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A");


      const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>G9 Jewellery - Order Invoice ${order.orderId}</title>
    <style>
      /* Base Styles */
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, Helvetica, sans-serif;
        background-color: #f5f5f5;
        color: #333;
      }
      .container {
        width: 100%;
        max-width: 850px;
        margin: 0 auto;
        background-color: #ffffff;
      }

      /* Header Section - Reduced height */
      .header {
        background-color: #0d1c39;
        padding: 15px 40px; /* Reduced from 25px */
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: white;
      }
      .logo-img {
        width: 120px; /* Reduced from 140px */
        height: 100px; /* Reduced from 120px */
      }
      .order-img {
        width: 350px; /* Reduced from 400px */
        height: 70px; /* Reduced from 90px */
      }

      /* Content Sections */
      .section {
        padding: 40px;
      }

      /* Order Meta Information */
      .order-meta-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 25px;
        margin-bottom: 10px;
      }
      .meta-item {
        display: grid;
        grid-template-columns: 130px auto;
        align-items: start;
        gap: 10px;
      }
      .meta-key,
      .meta-value {
        display: flex;
        flex-direction: column;
      }
      .meta-value {
        text-align: right;
      }
      .meta-label {
        font-weight: bold;
        font-size: 12px;
        color: #000;
        letter-spacing: 0.5px;
      }
      .order-id {
        font-size: 12px;
        font-weight: bold;
        color: #333;
      }

      /* Section Headers */
      .section-line {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        width: 100%;
      }
      .section-title {
        background-color: #0d1c39;
        color: white;
        padding: 10px 16px;
        border-radius: 60px;
        font-size: 12px;
        font-weight: bold;
        letter-spacing: 1px;
        white-space: nowrap;
      }
      .section-underline {
        height: 2px;
        background-color: #333;
        width: 100%;
        margin-top: 8px;
      }

      /* Customer Information - Updated for paired layout */
      .customer-info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px; /* Reduced spacing */
        margin-top: 15px;
      }
      .customer-pair {
        display: flex;
        flex-direction: column;
      }
      .customer-info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px; /* Reduced from 14px */
      }
      .info-label {
        font-weight: bold;
        color: #000;
        font-size: 10px;
        letter-spacing: 0.5px;
        margin: 0;
        min-width: 80px; /* Reduced from 120px */
      }
      .info-value {
        flex: 1;
        font-size: 10px;
        text-align: right;
        margin: 0;
        padding-bottom: 6px;
        border-bottom: 1px solid #ccc;
        color: #929292;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Products Table */
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
        margin-bottom: 20px;
      }
      th {
        text-align: left;
        padding: 10px 0;
        font-weight: bold;
        font-size: 11px;
        letter-spacing: 0.5px;
        color: #000;
        border-bottom: 2px solid #333;
      }
      td {
        padding: 8px 0;
        border-bottom: 1px solid #ddd;
        color: #333;
      }
      .text-center {
        text-align: center;
      }
      .text-right {
        text-align: right;
      }

      /* Summary Grid */
      .summary-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 40px;
        margin-top: 20px;
      }

      /* Summary Boxes */
      .summary-box .section-title {
        margin-bottom: 15px;
      }
      .box-inner {
        margin-top: 10px;
      }

      /* Pair Rows (used in payment summary and transaction info) */
      .pair-row {
        display: grid;
        grid-template-columns: 150px 1fr;
        gap: 20px;
        margin-bottom: 14px;
      }
      .pair-row-gst {
        display: grid;
        grid-template-columns: 150px 1fr;
        gap: 20px;
        margin-bottom: 6px;
      }
      .pair-left,
      .pair-right {
        display: flex;
        flex-direction: column;
      }
      .info-value-small {
        margin: 0;
        text-align: right;
        color: #555;
        font-size: 10px;
      }

      /* GST Section */
      .gst-title {
        font-weight: bold;
        font-size: 12px;
        margin: 10px 0;
        color: #000;
      }

      /* Total Row */
      .total-row .pair-left p,
      .total-row .pair-right p {
        font-weight: bold;
        font-size: 14px;
        color: #0d1c39;
      }

      /* Note Box */
      .note-box {
        margin-top: 15px;
        text-align: center;
        background-color: #eff2f5;
        padding: 18px;
        border-radius: 3px;
        font-size: 14px;
        line-height: 1.6;
        color: #555;
      }

      /* Shipping Section */
      .shipping-wrapper {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        margin-top: 20px;
      }
      .shipping-row {
        display: grid;
        grid-template-columns: 180px 1fr;
        align-items: start;
        margin-bottom: 10px;
      }
      .shipping-key,
      .shipping-value {
        display: flex;
        flex-direction: column;
      }
      .shipping-value {
        text-align: right;
        font-size: 12px;
      }
      .shipping-address {
        padding: 12px 0;
        line-height: 1.6;
        font-size: 13px;
        font-weight: 600;
      }
      .shipping-image {
        width: 100%;
        max-width: 270px;
        object-fit: contain;
      }

      /* Underline Styles */
      .underline-dark {
        height: 2px;
        background-color: #333;
        width: 100%;
        margin-top: 4px;
      }
      .underline-light {
        height: 2px;
        background-color: #b3b3b3;
        width: 100%;
        margin-top: 4px;
      }
        @page:first {
    margin-top: 0; /* no top margin for the first page */
    margin-bottom: 50px; /* keep bottom margin same as your puppeteer setting */
  }

  /* Second page and onward */
  @page {
    margin-top: 50px; /* top margin only on second page */
    margin-bottom: 50px;
  }

  /* Force content to break to second page */
  .page-break {
    page-break-before: always;
  }
    </style>
  </head>
  <body>
    <div class="container">
      <!-- Header with reduced height -->
      <div class="header">
        <div>
          <div>
            <img src="https://api.g9jewellery.com/uploads/invoiceImg/logo.png" alt="logo" class="logo-img" />
          </div>
        </div>
        <div>
          <img src="https://api.g9jewellery.com/uploads/invoiceImg/order_invoice.png" alt="order" class="order-img" />
        </div>
      </div>

      <!-- Main Content -->
      <div class="section">
        <!-- Order Date & ID -->
        <div class="order-meta-grid">
          <div class="meta-item">
            <div class="meta-key">
              <span class="meta-label">INVOICE DATE:</span>
              <div class="underline-dark"></div>
            </div>
            <div class="meta-value">
              <span style="font-size: 12px;">${orderDateDisplay}</span>
              <div class="underline-light"></div>
            </div>
          </div>

          <div class="meta-item">
            <div class="meta-key">
              <span class="meta-label">INVOICE ID:</span>
              <div class="underline-dark"></div>
            </div>
            <div class="meta-value">
              <span class="order-id">#${order.orderId}</span>
              <div class="underline-light"></div>
            </div>
          </div>
        </div>

        <!-- Customer Information - Updated with paired layout -->
        <div>
          <div class="section-line">
            <div class="section-title">CUSTOMER INFORMATION:</div>
            <div class="section-underline"></div>
          </div>
          
          <!-- Name field (full width) -->
          <div style="margin-top: 15px">
            <div class="customer-info-row">
              <div style="margin-right: 10px">
                <p class="info-label">NAME:</p>
                <div class="underline-dark"></div>
              </div>
              <p class="info-value">${userName}</p>
            </div>
          </div>
          
          <!-- Paired fields in grid -->
          <div class="customer-info-grid">
            <!-- Phone and Email Pair -->
            <div class="customer-pair">
              <!-- PHONE -->
              <div class="customer-info-row">
                <div style="margin-right: 10px">
                  <p class="info-label">PHONE:</p>
                  <div class="underline-dark"></div>
                </div>
                <p class="info-value">${userPhone}</p>
              </div>

              <!-- EMAIL -->
              <div class="customer-info-row">
                <div style="margin-right: 10px">
                  <p class="info-label">EMAIL:</p>
                  <div class="underline-dark"></div>
                </div>
                <p class="info-value">${userEmail}</p>
              </div>
            </div>

            <!-- GST Name and Number Pair -->
            <div class="customer-pair">
              <!-- GST Name -->
              <div class="customer-info-row">
                <div style="margin-right: 10px">
                  <p class="info-label">GST Name:</p>
                  <div class="underline-dark"></div>
                </div>
                <p class="info-value">${gstName}</p>
              </div>

              <!-- GST Number -->
              <div class="customer-info-row">
                <div style="margin-right: 10px">
                  <p class="info-label">GST Number:</p>
                  <div class="underline-dark"></div>
                </div>
                <p class="info-value">${GstNumber}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Products -->
        <div style="margin-top: 10px">
          <div class="section-line">
            <div class="section-title">PRODUCTS:</div>
            <div class="section-underline"></div>
          </div>

          <table style="margin-top: 8px">
            <thead>
              <tr>
                <th>STOCK NO:</th>
                <th>PURITY:</th>
                <th>COLOR:</th>
                <th class="text-center">QTY:</th>
                <th class="text-right">UNIT PRICE</th>
              </tr>
            </thead>
            <tbody>
              ${productRows || `<tr><td colspan="6" style="text-align:center">No products</td></tr>`}
            </tbody>
          </table>
        </div>

        <!-- Payment Summary + Transaction Info -->
        <div class="summary-grid">
          <!-- Payment Summary -->
          <div class="summary-box">
            <div class="section-title">PAYMENT SUMMARY:</div>

            <div class="box-inner">
              <div class="pair-row">
                <div class="pair-left">
                  <p class="info-label">SUBTOTAL:</p>
                  <div class="underline-dark"></div>
                </div>
                <div class="pair-right">
                  <p class="info-value-small">₹${Number(subtotal).toFixed(2)}</p>
                  <div class="underline-light"></div>
                </div>
              </div>

              <div class="pair-row">
                <div class="pair-left">
                  <p class="info-label">SHIPPING FEES :</p>
                  <div class="underline-dark"></div>
                </div>
                <div class="pair-right">
                  <p class="info-value-small">₹${Number(shipping_fee).toFixed(2)}</p>
                  <div class="underline-light"></div>
                </div>
              </div>

              <div class="pair-row">
                <div class="pair-left">
                  <p class="info-label">INSURANCE CHARGE:</p>
                  <div class="underline-dark"></div>
                </div>
                <div class="pair-right">
                  <p class="info-value-small">₹${Number(insurance_fee).toFixed(2)}</p>
                  <div class="underline-light"></div>
                </div>
              </div>

              <!-- GST SECTION -->
              <p class="gst-title">GST & TAXES :</p>

              <div class="pair-row-gst">
                <div class="pair-left">
                  <p class="info-label">CGST</p>
                </div>
                <div class="pair-right">
                  <p class="info-value-small">₹${Number(cgst).toFixed(2)}</p>
                </div>
              </div>

              <div class="pair-row-gst">
                <div class="pair-left">
                  <p class="info-label">IGST</p>
                  <div class="underline-dark"></div>
                </div>
                <div class="pair-right">
                  <p class="info-value-small">₹${Number(igst).toFixed(2)}</p>
                  <div class="underline-light"></div>
                </div>
              </div>

              <div class="pair-row total-row">
                <div class="pair-left">
                  <p class="info-label">TOTAL</p>
                  <div class="underline-dark"></div>
                </div>
                <div class="pair-right">
                  <p class="info-value-small">₹${Number(totalAmount).toFixed(2)}</p>
                  <div class="underline-light"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- TRANSACTION INFORMATION -->
          <div class="summary-box">
            <div class="section-title">TRANSACTION INFORMATION:</div>

            <div class="box-inner">
              <div class="pair-row">
                <div class="pair-left">
                  <p class="info-label">PAYMENT ID :</p>
                  <div class="underline-dark"></div>
                </div>
                <div class="pair-right">
                  <p class="info-value-small">${razorpayPaymentId}</p>
                  <div class="underline-light"></div>
                </div>
              </div>

              <div class="pair-row">
                <div class="pair-left">
                  <p class="info-label">PAYMENT METHOD :</p>
                  <div class="underline-dark"></div>
                </div>
                <div class="pair-right">
                  <p class="info-value-small">${razorpayMethod}${razorpayCardLast4 ? ` - ****${razorpayCardLast4}` : ""}</p>
                  <div class="underline-light"></div>
                </div>
              </div>

              <div class="pair-row">
                <div class="pair-left">
                  <p class="info-label">TRANSACTION DATE :</p>
                  <div class="underline-dark"></div>
                </div>
                <div class="pair-right">
                  <p class="info-value-small">${transactionDateDisplay}</p>
                  <div class="underline-light"></div>
                </div>
              </div>

              <div class="note-box">
                <strong>Note:-</strong> Return charge of ${Number(returnCharge)} is applicable for
                this order as per our return policy
              </div>
            </div>
          </div>
        </div>

        <!-- Shipping Details -->
        <div>
          <div class="section-title" style="margin-top: 10px; width: fit-content;">SHIPPING DETAILS:</div>

          <div class="shipping-wrapper">
            <!-- LEFT SIDE = TEXT BLOCK -->
            <div>
              <!-- Address Type Row -->
              <div class="shipping-row">
                <div class="shipping-key" style="margin-right: 20px;">
                  <p class="info-label">ADDRESS TYPE:</p>
                  <div class="underline-dark"></div>
                </div>

                <div class="shipping-value">
                  ${addressType}
                  <div class="underline-light"></div>
                </div>
              </div>

              <!-- Address Full Section -->
              <div class="shipping-address">
                <span>${addressLine1}</span><br/>
                <span>${addressLine2}</span><br/>
                <span>${city ? city + ", " : ""}${state ? state + ", " : ""}${country ? country + " - " : ""}${pincode ? pincode : ""}</span>
                <div class="underline-light"></div>
              </div>
            </div>

            <!-- RIGHT SIDE = IMAGE -->
            <div style="display: flex; justify-content: center; align-items: flex-start;">
              <img src="https://api.g9jewellery.com/uploads/invoiceImg/thank_you.png" alt="shipping" class="shipping-image"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
`;

      const invoiceFileName = `${String(order.orderId).replace(/[^a-zA-Z0-9-_\.]/g, "")}.pdf`;
      await generatePDF(html, invoiceFileName);

      await knex("invoices").insert({
        orderId: order.id,
        invoiceId: order.orderId,
        invoice: invoiceFileName,
        totalamount: totalAmount
      });

      const totalQty = orderProducts.reduce((sum, item) => sum + (item.qty || 1), 0);

      await sendOrderPlacedEmail({
        to: userEmail,
        customerName: userName,
        orderDetails: {
          id: order.id,
          orderId: order.orderId,
          amount: totalAmount,
          totalQty
        },
        invoiceFileName
      });


      const mobile = userPhone; // get from your user object
      const sendWhatsAppResult = await sendWhatsappInvoicePDF(mobile, invoiceFileName, userName);

      console.log("🚀 ~ orderService ~ createInvoice ~ sendWhatsAppResult:", sendWhatsAppResult)

      if (!sendWhatsAppResult.success) {
        console.error("Failed to send WhatsApp invoice:", sendWhatsAppResult.message);
      }
      else {
        // Check message status
        const messageSid = sendWhatsAppResult.sid;
        const messageStatus = await client.messages(messageSid).fetch();

        console.log("🚀 ~ WhatsApp Message Status:", {
          sid: messageStatus.sid,
          status: messageStatus.status,  // possible values: queued, sending, sent, delivered, undelivered, failed
          to: messageStatus.to,
          dateCreated: messageStatus.dateCreated,
        });
      }

      return {
        status: true,
        message: "Invoice generated successfully",
        invoice: invoiceFileName,
        path: `/uploads/invoice/${invoiceFileName}`,
      };
    } catch (error) {
      return { status: false, message: error.message };
    }
  }


  async getInvoice(authUser) {
    try {
      const baseUrl = process.env.PRODUCT_BASE_URL;

      const invoices = await knex('invoices')
        .join('orders', 'invoices.orderId', 'orders.id')
        .where('orders.userId', authUser.id)
        .select(
          'invoices.id',
          'invoices.orderId',
          'invoices.invoiceId',
          'invoices.invoice',
          'invoices.createdAt',
          'invoices.updatedAt',
          'orders.orderId as orderNumber',
          'orders.userId'
        )
        .orderBy('invoices.createdAt', 'desc');

      const fullInvoices = invoices.map(inv => ({
        id: inv.id,
        userId: inv.userId,
        orderId: inv.orderId,
        invoiceId: inv.invoiceId,
        invoice: `${baseUrl}/uploads/invoice/${inv.invoice}`,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt
      }));

      return {
        status: true,
        message: 'Invoices fetched successfully',
        data: {
          user_id: authUser.id,
          invoices: fullInvoices
        }
      };

    } catch (err) {
      console.log("Get invoice error:", err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
    }
  }




}

export default new orderService()