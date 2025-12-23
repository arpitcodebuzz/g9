import knex from '../../common/config/database.config'
import { sendUserEmail } from '../../common/config/nodemailer.config'
import { generatePDF } from '../../common/utils/pdfGenerator'
import path from 'path'
import fs from 'fs'
import {
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendInvoiceEmail,
  sendOrderInQueueEmail
} from '../../common/config/nodemailer.config';

class orderService {
  async list(query) {
    try {
      const { startDate, endDate, search } = query;

      const orderQuery = knex('orders')
        .leftJoin('users', 'orders.userId', 'users.id')
        .select('orders.*', 'orders.invoice', 'users.name as userName', 'users.email as userEmail', 'users.Mobile_number as userMobileNumber')
        .orderBy('orders.createdAt', 'desc');

      if (startDate && endDate) {
        orderQuery.whereBetween(knex.raw('DATE(orders.createdAt)'), [startDate, endDate]);
      } else if (startDate) {
        orderQuery.where(knex.raw('DATE(orders.createdAt)'), '>=', startDate);
      } else if (endDate) {
        orderQuery.where(knex.raw('DATE(orders.createdAt)'), '<=', endDate);
      }

      if (search) {
        orderQuery.where(function () {
          this.where('orders.razorpayPaymentId', 'like', `%${search}%`)
            .orWhere('users.name', 'like', `%${search}%`)
            .orWhere('users.email', 'like', `%${search}%`)
            .orWhere('orders.orderId', 'like', `%${search}%`);
        });
      }

      const orderData = await orderQuery;
      // cons

      if (!orderData || orderData.length === 0) {
        return {
          status: true,
          message: 'No orders found',
          data: { orders: [] }
        };
      }

      const baseUrl = process.env.PRODUCT_BASE_URL;
      const orders = [];
      let totalReceivedPayment = 0;

      for (const order of orderData) {
        let parsedProducts = [];
        try {
          parsedProducts = JSON.parse(order.products || "[]");
        } catch {
          parsedProducts = [];
        }
        // console.log("🚀 ~ orderService ~ list ~ parsedProducts:", parsedProducts)

        const productIds = [...new Set(parsedProducts.map(p => Number(p.productId)).filter(Boolean))];

        let orderItems = [];
        if (productIds.length > 0) {
          const products = await knex('products as p')
            .whereIn('p.id', productIds)
            .leftJoin('product_images as pi', 'p.id', 'pi.productId')
            .leftJoin('metals as m', 'pi.metalId', 'm.id')
            .select(
              'p.id',
              'p.title',
              'p.selling_price',
              'p.purity',
              'p.stockNumber',
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

            const qty = Number(item.qty || 1);
            const price = selectedPurity?.profitsellingprice
              ? Number(selectedPurity.profitsellingprice)
              : Number(product.selling_price || 0);

            const gstAmount = selectedPurity?.gstAmount ? Number(selectedPurity.gstAmount) : 0;
            const totalPrice = price * qty;

            const mediaMap = {};
            const productRows = products.filter(prod => prod.id === item.productId);

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

            const media = mediaMap[item.metalId] ? [mediaMap[item.metalId]] : [];

            return {
              productId: product.id,
              title: product.title,
              quantity: qty,
              price: price.toFixed(2),
              subtotal: totalPrice.toFixed(2),
              stockNumber: product.stockNumber,
              status: item.status || 'Pending',
              isPdf: item.isPdf,
              purity: selectedPurity
                ? {
                  value: selectedPurity.value,
                  name: selectedPurity.name,
                  profitoriginalprice: selectedPurity.profitoriginalprice,
                  profitsellingprice: selectedPurity.profitsellingprice
                }
                : null,
              media,
              gstAmount
            };
          }).filter(Boolean);
        }


        const statuses = orderItems.map(i => i.status);
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

        if (paymentDetails.total) {
          totalReceivedPayment += Number(paymentDetails.total) || 0;
        }
        // console.log(totalReceivedPayment)


        const invoiceMap = {};
        const invoiceRows = await knex('invoices').select('orderId', 'invoice');
        invoiceRows.forEach(inv => {
          invoiceMap[inv.orderId] = inv.invoice;
        });

        const invoiceUrl = invoiceMap[order.id]
          ? `${process.env.INVOICE_URL}/${invoiceMap[order.id]}`
          : null;

        orders.push({
          id: order.id,
          orderId: order.orderId,
          status: orderStatus,
          paymentId: order.razorpayPaymentId || null,
          totalItems: orderItems.length,
          name: order.userName,
          email: order.userEmail,
          createdAt: order.createdAt,
          userId: order.userId,
          items: orderItems,
          invoice: invoiceUrl,
          paymentDetails
        });
      }

      return {
        status: true,
        message: 'Orders fetched successfully!',
        data: {
          orders,
          totalReceivedPayment: totalReceivedPayment.toFixed(2)
        }

      };

    } catch (err) {
      console.error("Order list error:", err);
      return { status: false, message: 'Something went wrong !!' };
    }
  }

  async subInvoice(body, res) {
    try {
      if (Array.isArray(body)) {
        const productIds = [];
        const metalIds = [];
        const purityValues = [];
        let orderId = null;

        body.forEach(item => {
          productIds.push(Number(item.productId));
          metalIds.push(Number(item.metalId));
          purityValues.push(Number(item.purityValue));
          orderId = item.orderId; // assume all items have same orderId
        });

        // Replace body with normalized structure expected by the rest of your function
        body = {
          productId: productIds,
          metalId: metalIds,
          purityValue: purityValues,
          orderId
        };
      }

      // Rest of your existing function remains **unchanged**
      const { productId, orderId, purityValue, metalId } = body;
      // console.log(body);

      const order = await knex('orders as o')
        .leftJoin('users as u', 'o.userId', 'u.id')
        .where('o.id', orderId)
        .select('o.*', 'u.email as userEmail', 'u.name as customerName', 'u.Mobile_number as userMobileNumber')
        .first();

      if (!order) return res.send({ status: false, message: 'No order found !!' });

      let orderProducts = [];
      try {
        orderProducts = JSON.parse(order.products || '[]');
      } catch (err) {
        return res.send({ status: false, message: 'Invalid product data in order' });
      }
      // console.log(orderProducts, 'orderProducts');

      let updated = false;

      orderProducts = orderProducts.map(p => {
        // console.log('---------------------------------------------------------------------------------------------------------------------------')
        // console.log(p, "==============================================")
        // console.log('---------------------------------------------------------------------------------------------------------------------------')
        // console.log("🚀 ~ orderService ~ subInvoice ~ productId:", p.productId, productId)
        // console.log("🚀 ~ orderService ~ subInvoice ~ purityValue:", p.purityValue, purityValue)
        // console.log("🚀 ~ orderService ~ subInvoice ~ metalId:", p.metalId, metalId)
        // console.log(productId.includes(p.productId) &&
        //   purityValue.includes(p.purityValue) &&
        //   metalId.includes(p.metalId), "------------------------")
        if (
          productId.includes(p.productId) &&
          purityValue.includes(p.purityValue) &&
          metalId.includes(p.metalId)
          // Number(p.productId) == Number(productId) &&
          // Number(p.purityValue) == Number(purityValue) &&
          // Number(p.metalId) == Number(metalId)
        ) {
          // console.log(p, "-----------------------------is pdf ----------------------")
          p.isPdf = true;
          updated = true;
        }
        return p;
      });

      await knex('orders').where('id', orderId).update({
        products: JSON.stringify(orderProducts),
        updatedAt: knex.fn.now()
      });

      const productIdsArr = Array.isArray(productId)
        ? productId.map(Number)
        : (typeof productId === 'string' ? productId.split(',').map(Number) : [Number(productId)]);

      const purityValuesArr = Array.isArray(purityValue)
        ? purityValue.map(Number)
        : (typeof purityValue === 'string' ? purityValue.split(',').map(Number) : [Number(purityValue)]);

      const metalIdsArr = Array.isArray(metalId)
        ? metalId.map(Number)
        : (typeof metalId === 'string' ? metalId.split(',').map(Number) : [Number(metalId)]);

      let foundAny = false;

      orderProducts.forEach((p, index) => {
        // console.log(p, "--------------------------p")
        const idx = productIdsArr.indexOf(Number(p.productId));
        if (idx !== -1 &&
          Number(p.purityValue) === purityValuesArr[idx] &&
          Number(p.metalId) === metalIdsArr[idx]
        ) {
          foundAny = true;
        }
      });

      if (!foundAny) return res.send({ status: false, message: 'No matching product(s) found in this order !!' });

      await knex("orders")
        .where({ id: orderId })
        .update({
          products: JSON.stringify(orderProducts),
          updatedAt: knex.fn.now(),
        });



      let selectedProductIds = [];
      // console.log("🚀 ~ orderService ~ status ~ selectedProductIds:", selectedProductIds)

      if (Array.isArray(body.productId)) {
        selectedProductIds = body.productId.map(id => Number(id)).filter(Boolean);
      } else if (typeof body.productId === "string" && body.productId.trim() !== "") {
        selectedProductIds = body.productId
          .split(",")
          .map(id => Number(id.trim()))
          .filter(Boolean);
      }

      let filteredOrderProducts = [];
      // console.log("🚀 ~ orderService ~ status ~ filteredOrderProducts:", filteredOrderProducts)

      if (selectedProductIds.length) {
        filteredOrderProducts = orderProducts.filter(item => {
          return selectedProductIds.some((id, idx) => {
            return Number(item.productId) === Number(id) &&
              Number(item.metalId) === Number(metalIdsArr[idx]) &&
              Number(item.purityValue) === Number(purityValuesArr[idx]);
          });
        });
      }


      let dbProducts = [];
      if (selectedProductIds.length) {
        dbProducts = await knex("products")
          .whereIn("id", selectedProductIds)
          .select("id", "title", "stockNumber");
      }

      const purityIds = filteredOrderProducts.map(p => p.purityValue).filter(Boolean);
      const metalIds = filteredOrderProducts.map(p => p.metalId).filter(Boolean);

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

      filteredOrderProducts.forEach((item) => {
        const product = dbProducts.find(p => p.id === Number(item.productId));

        const title = product?.title || item.title || "N/A";
        const stockNumber = product?.stockNumber || item.stockNumber || "N/A";

        const purity = purityList.find(p => p.id === item.purityValue)?.name || "N/A";
        const color = metalList.find(m => m.id === item.metalId)?.name || "N/A";

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


      let paymentDetails = {};
      try {
        paymentDetails = JSON.parse(order.paymentDetails || "{}");
      } catch (err) {
        paymentDetails = {};
      }

      function numberToLetters(num) {
        let letters = "";

        while (num > 0) {
          let mod = (num - 1) % 26;
          letters = String.fromCharCode(65 + mod) + letters;
          num = Math.floor((num - mod) / 26);
        }

        return letters;
      }

      function generateSubInvoice(invoiceNo, sequenceNumber) {
        const letter = numberToLetters(sequenceNumber);
        return `${invoiceNo}(${letter})`;
      }
      let seq = 1
      const checkMainInvoice = await knex("subInvoice").where({ orderId: order.id })
      if (checkMainInvoice.length == 0) {
        seq = 1
      } else {
        seq = checkMainInvoice.length + 1
      }
      const invoiceRecord = await knex("invoices")
        .where({ orderId: order.id })
        .orderBy("id", "desc")
        .first();
      const subInvoiceNo = generateSubInvoice(invoiceRecord.invoiceId, seq)

      // const SubinvoiceFileName = `${cleanOrderId}(${nextSuffix}).pdf`;
      const SubinvoiceFileName = `${subInvoiceNo}.pdf`;
      const subtotal = filteredOrderProducts.reduce((sum, item) => {
        const price = item.price ?? 0;
        const qty = item.qty ?? 1;
        return sum + price * qty;
      }, 0);

      const totalProductsCount = orderProducts.length;

      const subInvoiceProductCount = filteredOrderProducts.length;

      const totalShipping = paymentDetails.deliveryCharge ?? 0;
      const totalInsurance = paymentDetails.insuranceCharge ?? 0;
      const totalReturnCharge = paymentDetails.returnCharge ?? 0;
      const totalCgst = paymentDetails.cgst ?? 0;
      const totalIgst = paymentDetails.igst ?? 0;

      const shipping_fee = (totalShipping / totalProductsCount) * subInvoiceProductCount;
      const insurance_fee = (totalInsurance / totalProductsCount) * subInvoiceProductCount;
      // const returnCharge = (totalReturnCharge / totalProductsCount) * subInvoiceProductCount;
      const cgst = (totalCgst / totalProductsCount) * subInvoiceProductCount;
      const igst = (totalIgst / totalProductsCount) * subInvoiceProductCount;

      const totalamount = subtotal + shipping_fee + insurance_fee + cgst + igst;
      let razorpay = {};
      try {
        razorpay = JSON.parse(order.razorpayDetail || "{}");
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
      const addressType = shipping?.address_type || "N/A";
      const addressLine1 = shipping?.address_line_1 || shipping?.address || "";
      const addressLine2 = shipping?.address_line_2 || shipping?.addressLine || "";
      const city = shipping?.city || "";
      const state = shipping?.state || "";
      const country = shipping?.country || "";
      const pincode = shipping?.postal_code || "";

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
            
                  /* Header Section */
                  .header {
                    background-color: #0d1c39;
                    padding: 15px 40px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: white;
                  }
                  .logo-img {
                    width: 120px;
                    height: 100px;
                  }
                  .order-img {
                    width: 350px;
                    height: 70px;
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
            
                  /* Customer Information */
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
                    padding: 8px 0;
                    font-weight: bold;
                    font-size: 11px;
                    letter-spacing: 0.5px;
                    color: #000;
                    border-bottom: 2px solid #333;
                  }
                  td {
                    padding: 12px 0;
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
                  <!-- Header -->
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
                          <span class="order-id">${subInvoiceNo}</span>
                          <div class="underline-light"></div>
                        </div>
                      </div>
                    </div>
            
                    <!-- Customer Information -->
                    <div>
                      <div class="section-line">
                        <div class="section-title">CUSTOMER INFORMATION:</div>
                        <div class="section-underline"></div>
                      </div>
                      <div style="margin-top: 15px">
                        <!-- NAME -->
                        <div class="customer-info-row">
                          <div style="margin-right: 10px">
                            <p class="info-label">NAME:</p>
                            <div class="underline-dark"></div>
                          </div>
                          <p class="info-value">${userName}</p>
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
                              <p class="info-value-small">₹${Number(totalamount).toFixed(2)}</p>
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
                            <strong>Note:-</strong> Return charge of ${Number(totalReturnCharge)} is applicable for
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

      const cleanOrderId = String(order.orderId).replace(/[^a-zA-Z0-9-_]/g, "");

      const existingSubs = await knex("subInvoice")
        .where({ orderId: order.id })
        .orderBy("id", "asc");
      // console.log("🚀 ~ orderService ~ subInvoice ~ existingSubs:", existingSubs)

      // let nextSuffix = "A";

      // if (existingSubs.length > 0) {
      //   const lastSub = existingSubs[existingSubs.length - 1].subInvoice;
      //   console.log("🚀 ~ orderService ~ subInvoice ~ lastSub:", lastSub)
      // console.log()

      //   const match = lastSub.match(/-([A-Z])\.pdf$/);
      //   console.log("🚀 ~ orderService ~ subInvoice ~ match:", match)

      //   if (match) {
      //     const lastLetter = match[1];
      //     nextSuffix = String.fromCharCode(lastLetter.charCodeAt(0) + 1);
      //   }
      // }


      await generatePDF(html, SubinvoiceFileName);


      if (invoiceRecord) {
        const mainInvoiceId = invoiceRecord.id;

        // function numberToLetters(num) {
        //   let letters = "";

        //   while (num > 0) {
        //     let mod = (num - 1) % 26;
        //     letters = String.fromCharCode(65 + mod) + letters;
        //     num = Math.floor((num - mod) / 26);
        //   }

        //   return letters;
        // }

        // function generateSubInvoice(invoiceNo, sequenceNumber) {
        //   const letter = numberToLetters(sequenceNumber);
        //   return `${invoiceNo}(${letter})`;
        // }
        const invoiceNo = invoiceRecord.invoiceId;

        // let seq = 1
        // const checkMainInvoice = await knex("subInvoice").where({ orderId: order.id })
        // if (checkMainInvoice.length == 0) {
        //   seq = 1
        // } else {
        //   seq = checkMainInvoice.length + 1
        // }
        // const invoiceNo = generateSubInvoice(invoiceRecord.invoiceId, seq)


        // console.log(Number(totalamount.toFixed(2)), "----------------------")



        const newSubInvoice = await knex("subInvoice").insert({
          mainInvoiceId,
          invoiceNo: invoiceNo,
          subInvoice: SubinvoiceFileName,
          orderId: invoiceRecord.orderId,
          totalamount: Number(totalamount.toFixed(2)),
          createdAt: knex.fn.now(),
          updatedAt: knex.fn.now()
        });

        let updated = false;

        orderProducts = orderProducts.map(p => {
          if (
            productId.includes(p.productId) &&
            purityValue.includes(p.purityValue) &&
            metalId.includes(p.metalId)
          ) {
            p.invoiceId = mainInvoiceId;
            p.subInvoiceNo = SubinvoiceFileName;
            updated = true;
          }
          return p;
        });

        await knex("orders")
          .where({ id: orderId })
          .update({
            products: JSON.stringify(orderProducts),
            updatedAt: knex.fn.now(),
          });

        const SubinvoiceFile = SubinvoiceFileName

        const baseUrl = process.env.INVOICE_URL;
        const fileUrl = `${baseUrl}/${SubinvoiceFile}`;

        // console.log(fileUrl, "-----------------fileUrl")

        const file = await fetch(fileUrl);
        const blob = await file.arrayBuffer();

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Content-Type", "application/pdf");

        res.send(Buffer.from(blob));

      } else {
        console.warn(`No invoice found for order ${order.id}, skipping subInvoice insertion.`);
        return res.send({
          status: true,
          message: `No invoice found for order ${order.id}, skipping subInvoice insertion.`
        });
      }

      // return {
      //   status: true,
      //   message: `subInvoice generated successfully !!`
      // };

    } catch (err) {
      console.error("Error updating product status:", err);
      return res.send({ status: false, message: 'Something went wrong !!' });
    }
  }





  async listOrder(params) {
    try {
      const { userId } = params;

      if (!userId) {
        return { status: false, message: 'userId is required' };
      }

      const ordersData = await knex('orders')
        .where('userId', userId)
        .leftJoin('users', 'orders.userId', 'users.id')
        .select('orders.*', 'users.name as userName', 'users.email as userEmail', 'users.Mobile_number as userMobileNumber')
        .orderBy('orders.createdAt', 'desc');



      if (!ordersData || ordersData.length === 0) {
        return { status: true, message: 'No orders found for this user', data: { orders: [] } };
      }


      const baseUrl = process.env.PRODUCT_BASE_URL;
      const orders = [];



      for (const order of ordersData) {
        let parsedProducts = [];
        const invoiceUrl = order.invoice ? `${process.env.INVOICE_URL}/${order.invoice}` : null;

        try {
          parsedProducts = JSON.parse(order.products || '[]');
        } catch {
          parsedProducts = [];
        }

        const productIds = [...new Set(parsedProducts.map(p => Number(p.productId)).filter(Boolean))];

        let orderItems = [];

        if (productIds.length > 0) {
          const products = await knex('products as p')
            .whereIn('p.id', productIds)
            .leftJoin('product_images as pi', 'p.id', 'pi.productId')
            .leftJoin('metals as m', 'pi.metalId', 'm.id')
            .select(
              'p.id',
              'p.title',
              'p.selling_price',
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

            const qty = Number(item.qty || 1);
            const price = selectedPurity?.profitsellingprice
              ? Number(selectedPurity.profitsellingprice)
              : Number(product.selling_price || 0);

            const gstAmount = selectedPurity?.gstAmount ? Number(selectedPurity.gstAmount) : 0;
            const totalPrice = price * qty;

            const mediaMap = {};
            const productRows = products.filter(prod => prod.id === item.productId);

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

            const media = mediaMap[item.metalId] ? [mediaMap[item.metalId]] : [];
            return {
              productId: product.id,
              title: product.title,
              quantity: qty,
              price: price.toFixed(2),
              subtotal: totalPrice.toFixed(2),
              stockNumber: product.stockNumber,
              status: item.status || 'Pending',
              purity: selectedPurity
                ? {
                  value: selectedPurity.value,
                  name: selectedPurity.name,
                  profitoriginalprice: selectedPurity.profitoriginalprice,
                  profitsellingprice: selectedPurity.profitsellingprice
                }
                : null,
              media,
              gstAmount
            };
          }).filter(Boolean);
        }

        const statuses = orderItems.map(i => i.status?.toLowerCase() || 'pending');
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
        orders.push({
          id: order.id,
          orderId: order.orderId,
          userId: order.userId,
          status: orderStatus,
          paymentId: order.razorpayPaymentId || null,
          createdAt: order.createdAt,
          name: order.userName,
          email: order.userEmail,
          totalItems: orderItems.length,
          items: orderItems,
          paymentDetails,
          invoice: invoiceUrl
        });
      }

      return {
        status: true,
        message: 'Orders fetched successfully!',
        data: { orders }
      };
    } catch (err) {
      console.error('listOrder error:', err);
      return { status: false, message: 'Something went wrong' };
    }
  }

  async detail(params) {
    try {
      const { orderId } = params;
      const baseUrl = process.env.PRODUCT_BASE_URL;



      const order = await knex('orders').where({ id: orderId }).first();
      if (!order) return { status: false, message: 'Order not found!' };

      const invoiceUrl = order.invoice ? `${process.env.INVOICE_URL}/${order.invoice}` : null;


      const user = await knex('users').where({ id: order.userId }).first();

      let address = null;
      if (order.userAddressId) {
        address = await knex('user_address').where({ id: order.userAddressId }).first();
      }

      let parsedProducts = [];
      try {
        parsedProducts = JSON.parse(order.products || '[]');
      } catch {
        parsedProducts = [];
      }

      // console.log("🚀 ~ orderService ~ detail ~ parsedProducts:", parsedProducts)
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
            'p.selling_price',
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

          const qty = Number(item.qty || 1);
          const price = selectedPurity?.profitsellingprice
            ? Number(selectedPurity.profitsellingprice)
            : Number(product.selling_price || 0);
          const gstAmount = selectedPurity?.gstAmount ? Number(selectedPurity.gstAmount) : 0;
          const totalPrice = price * qty;

          const mediaMap = {};
          const productRows = products.filter(prod => prod.id === item.productId);

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

          const media = mediaMap[item.metalId] ? [mediaMap[item.metalId]] : [];
          return {
            productId: product.id,
            title: product.title,
            quantity: qty,
            stockNumber: product.stockNumber,
            price: price.toFixed(2),
            subtotal: totalPrice.toFixed(2),
            status: item.status || 'Pending',
            isPdf: item.isPdf,
            invoiceId: item.invoiceId,
            subInvoiceNo: item.subInvoiceNo,
            purity: selectedPurity
              ? {
                value: selectedPurity.value,
                name: selectedPurity.name,
                profitoriginalprice: selectedPurity.profitoriginalprice,
                profitsellingprice: selectedPurity.profitsellingprice
              }
              : null,
            media,
            gstAmount,
            productLink: `${process.env.PRODUCT_URL}/${product.id}`
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

      return {
        status: true,
        message: 'Order details fetched successfully!',
        data: {
          id: order.id,
          orderId: order.orderId,
          createdAt: order.createdAt,
          paymentId: order.razorpayPaymentId || null,
          status: orderStatus,
          gstDetails: { name: order.name, GstNumber: order.GstNumber },
          user: user ? { id: user.id, name: user.name, email: user.email, mobileNumber: user.Mobile_number } : null,
          transcationDetails: JSON.parse(order.razorpayDetail),
          address,
          items: orderItems,
          paymentDetails,
          invoice: invoiceUrl,
        }
      };

    } catch (err) {
      console.error('Order detail error:', err);
      return { status: false, message: 'Something went wrong !!!' };
    }
  }

  async shareInvoice(body) {
    try {
      const { orderId } = body;
      if (!orderId) throw new Error("orderId is required");

      const order = await knex("orders as o")
        .leftJoin("users as u", "o.userId", "u.id")
        .select(
          "o.id",
          "o.orderId",
          "u.name as userName",
          "u.email as userEmail",
          "u.Mobile_number as userMobileNumber"
        )
        .where("o.id", orderId)
        .first();

      if (!order) throw new Error("Order not found");

      const invoiceData = await knex("invoices")
        .select("invoice")
        .where("orderId", orderId)
        .first();

      if (!invoiceData || !invoiceData.invoice) {
        throw new Error("Invoice not generated for this order");
      }

      const invoiceFileName = invoiceData.invoice;

      const emailResult = await sendInvoiceEmail(
        order.userEmail,
        order.userName,
        order.orderId,
        invoiceFileName
      );

      return {
        status: true,
        message: "Invoice sent successfully!",
        emailResult
      };

    } catch (err) {
      console.log("shareInvoice error:", err.message);
      return {
        status: false,
        message: err.message || "Something went wrong!"
      };
    }
  }


  async downloadInvoice(body) {
    try {
      const { orderId } = body
      // console.log(body)

      if (!orderId) {
        throw new Error("orderId is required");
      }

      const order = await knex("orders as o")
        .leftJoin("users as u", "o.userId", "u.id")
        .select(
          "o.id",
          "o.orderId",
          "o.invoice",
          "u.name as userName",
          "u.email as userEmail",
          'u.Mobile_number as userMobileNumber'
        )
        .where("o.id", orderId)
        .first();
      // console.log(order, 'order')

      if (!order) {
        throw new Error("Order not found");
      }

      if (!order.invoice) {
        throw new Error("Invoice not generated for this order");
      }

      const baseUrl = process.env.PRODUCT_BASE_URL;
      // const invoiceUrl = `${baseUrl}/public/uploads/invoice/${order.invoice}`;

      const invoiceFilePath = path.join(__dirname, "../../../uploads/invoice", order.invoice);
      // console.log(invoiceFilePath,'invoiceFilePath')

      // await sendInvoiceEmail(order.userEmail, order.userName, order.orderId, order.invoice);

      return {
        status: true,
        message: "Invoice sent successfully!"
      };

    }
    catch (err) {
      console.log(err)
      return {
        status: false,
        message: 'Something went wrong !!'
      }
    }
  }

  async generateSubInvoice(body) {
    try {
      const { productId, orderId, metalId, purityValue } = body;

      if (!productId || !orderId || !metalId || !purityValue) {
        return { status: false, message: "All fields are required" };
      }

      const order = await knex("orders").where("id", orderId).first();
      if (!order)
        return { status: false, message: "Order not found" };

      const orderItem = await knex("order_items")
        .where("orderId", orderId)
        .andWhere("productId", productId)
        .first();

      if (!orderItem)
        return { status: false, message: "Product not found inside this order" };

      const random = Math.floor(100000 + Math.random() * 900000);
      const subInvoiceId = `SUB-${random}`;
      const fileName = `${subInvoiceId}.pdf`;

      const html = `
      <html>
        <body style="font-family: Arial; padding: 20px;">

          <h2>Sub Invoice</h2>

          <p><strong>Main Order ID:</strong> #${order.orderId}</p>
          <p><strong>Sub Invoice ID:</strong> ${subInvoiceId}</p>

          <hr/>

          <h3>Product Details</h3>
          <p><strong>Product ID:</strong> ${productId}</p>
          <p><strong>Product Name:</strong> ${orderItem.productName}</p>
          <p><strong>Quantity:</strong> ${orderItem.quantity}</p>

          <h3>Metal Details</h3>
          <p><strong>Metal ID:</strong> ${metalId}</p>
          <p><strong>Purity:</strong> ${purityValue}</p>

          <hr/>

          <p>Generated on: ${new Date().toLocaleString()}</p>

        </body>
      </html>
    `;

      await generatePDF(html, fileName);

      await knex("subinvoices").insert({
        orderId,
        productId,
        metalId,
        purityValue,
        subInvoiceId: `#${subInvoiceId}`,
        fileName,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const fileUrl = `${process.env.PRODUCT_BASE_URL}/uploads/invoice/${fileName}`;
      // console.log("🚀 ~ orderService ~ subInvoice ~ fileUrl:", fileUrl)

      return {
        status: true,
        message: "Sub invoice generated successfully",
        data: {
          subInvoiceId: `#${subInvoiceId}`,
          fileName,
          fileUrl,
        },
      };
    }
    catch (err) {
      console.log(err)
      return {
        status: false,
        message: 'Something went wrong !!'
      }
    }
  }

  async getInvoice() {
    try {
      const baseUrl = process.env.PRODUCT_BASE_URL;

      const invoices = await knex('invoices')
        .join('orders', 'invoices.orderId', 'orders.id')
        .join('users', 'orders.userId', 'users.id')
        .select(
          'invoices.id',
          'invoices.orderId',
          'invoices.invoiceId',
          'invoices.invoice',
          'invoices.totalamount',
          'invoices.createdAt',
          'invoices.updatedAt',
          'orders.orderId as orderNumber',
          'orders.userId',
          'users.name as userName'
        )
        .orderBy('invoices.createdAt', 'desc');

      const subCounts = await knex('subInvoice')
        .select('mainInvoiceId')
        .count('id as count')
        .groupBy('mainInvoiceId');

      const subCountsMap = {};
      subCounts.forEach(item => {
        subCountsMap[item.mainInvoiceId] = Number(item.count);
      });

      const fullInvoices = invoices.map(inv => ({
        id: inv.id,
        userId: inv.userId,
        orderId: inv.orderId,
        invoiceId: inv.invoiceId,
        totalamount: inv.totalamount,
        // invoice: `https://api.g9jewellery.com/uploads/invoice/${inv.invoice}`,
        invoice: `${process.env.INVOICE_URL}/${inv.invoice}`,
        userName: inv.userName,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt,
        subInvoiceCount: subCountsMap[inv.id] || 0
      }));

      return {
        status: true,
        message: 'Invoices fetched successfully',
        data: {
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


  async getSubInvoice(params) {
    try {
      const { mainInvoiceId } = params

      const baseUrl = process.env.PRODUCT_BASE_URL;

      const invoices = await knex('subInvoice').where('mainInvoiceId', mainInvoiceId).select()
        .orderBy('createdAt', 'desc');

      const fullInvoices = invoices.map(inv => ({
        id: inv.id,
        mainInvoiceId: inv.mainInvoiceId,
        invoiceNo: inv.invoiceNo,
        subInvoiceNo: inv.subInvoice,
        orderId: inv.orderId,
        totalamount: inv.totalamount,
        // subInvoice: `https://api.g9jewellery.com/uploads/invoice/${inv.subInvoice}`,
        subInvoice: `${process.env.INVOICE_URL}/${inv.subInvoice}`,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt
      }));

      return {
        status: true,
        message: 'SubInvoices fetched successfully',
        data: {
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

  // async changeProductStatus(body) {
  //   try {
  //     const { orderId, productId, purityValue, metalId, status } = body;

  //     const order = await knex('orders as o')
  //       .leftJoin('users as u', 'o.userId', 'u.id')
  //       .where('o.id', orderId)
  //       .select('o.*', 'u.email as userEmail', 'u.name as customerName', 'u.Mobile_number as userMobileNumber')
  //       .first();

  //     if (!order) return { status: false, message: 'Order not found' };

  //     let orderProducts = [];
  //     try {
  //       orderProducts = JSON.parse(order.products || '[]');
  //     } catch (err) {
  //       return { status: false, message: 'Invalid product data in order' };
  //     }

  //     let updated = false;

  //     orderProducts = orderProducts.map(p => {
  //       if (
  //         Number(p.productId) === Number(productId) &&
  //         Number(p.purityValue) === Number(purityValue) &&
  //         Number(p.metalId) === Number(metalId)
  //       ) {
  //         p.status = status;
  //         updated = true;
  //       }
  //       return p;
  //     });

  //     if (!updated) return { status: false, message: 'No matching product found in this order' };

  //     await knex('orders').where('id', orderId).update({
  //       products: JSON.stringify(orderProducts),
  //       updatedAt: knex.fn.now()
  //     });

  //     const recipientEmail = order.userEmail;
  //     const customerName = order.customerName || "Customer";
  //     const firstProductId = productId[0];
  //     const product = await knex('products').where({ id: firstProductId }).first();
  //     const productTitle = product?.title || 'Product';
  //     const stockNumber = product?.stockNumber || 'N/A';
  //     const amount = product?.price || 'N/A';

  //     switch (status) {
  //       case "Ready to Ship":
  //         await sendOrderShippedEmail(recipientEmail, customerName, {
  //           orderId: order.orderId,
  //           productTitle,
  //           stockNumber,
  //           amount,
  //           courierName: product?.courierName || "Courier Partner",
  //           trackingNumber: product?.trackingNumber || "N/A",
  //           trackingLink: product?.trackingLink || "https://g9jewellery.com"
  //         });
  //         break;

  //       case "Delivered":
  //         await sendOrderDeliveredEmail(recipientEmail, customerName, {
  //           orderId: order.orderId,
  //           productTitle,
  //           stockNumber,
  //           amount
  //         });
  //         break;

  //       case "Queued":
  //         await sendOrderInQueueEmail(recipientEmail, customerName, {
  //           orderId: order.orderId,
  //           productTitle,
  //           stockNumber
  //         });
  //         break;
  //     }

  //     return {
  //       status: true,
  //       message: 'Product status updated successfully !!'
  //     };

  //   } catch (err) {
  //     console.error("Error updating product status:", err);
  //     return { status: false, message: 'Something went wrong' };
  //   }
  // }

  async changeProductStatus(body) {
    try {
      const { orderId, productId, purityValue, metalId, status } = body;

      const order = await knex('orders as o')
        .leftJoin('users as u', 'o.userId', 'u.id')
        .where('o.id', orderId)
        .select(
          'o.*',
          'u.email as userEmail',
          'u.name as customerName',
          'u.Mobile_number as userMobileNumber'
        )
        .first();

      if (!order) {
        return { status: false, message: 'Order not found' };
      }

      let orderProducts = [];
      try {
        orderProducts = JSON.parse(order.products || '[]');
      } catch (err) {
        return { status: false, message: 'Invalid product data in order' };
      }

      let updatedProduct = null;

      orderProducts = orderProducts.map(p => {
        if (
          Number(p.productId) === Number(productId) &&
          Number(p.purityValue) === Number(purityValue) &&
          Number(p.metalId) === Number(metalId)
        ) {
          p.status = status;
          updatedProduct = p;
        }
        return p;
      });

      if (!updatedProduct) {
        return { status: false, message: 'No matching product found in this order' };
      }

      await knex('orders')
        .where('id', orderId)
        .update({
          products: JSON.stringify(orderProducts),
          updatedAt: knex.fn.now()
        });

      const product = await knex('products as p')
        .leftJoin('product_images as pi', 'p.id', 'pi.productId')
        .where('p.id', updatedProduct.productId)
        .select(
          'p.id',
          'p.title',
          'p.stockNumber',
          knex.raw(`GROUP_CONCAT(pi.image) as images`)
        )
        .groupBy('p.id')
        .first();

      let productImages = [];
      if (product?.images) {
        productImages = product.images.split(','); // convert comma-separated string to array
      }

      console.log("🚀 productImages:", productImages);



      const emailOrder = {
        orderId: order.orderId,
        status,
        createdAt: order.createdAt,
        paymentStatus: order.razorpayPaymentId ? 'Paid' : 'Pending',
        paymentDetails: order.paymentDetails || {},
        items: [
          {
            productId: updatedProduct.productId,
            title: product?.title || 'Product',
            status: updatedProduct.status,
            quantity: updatedProduct.qty || 1,
            price: updatedProduct.price || updatedProduct.subtotal || product?.price || '0.00',
            subtotal: updatedProduct.subtotal || '0.00',
            stockNumber: product?.stockNumber || 'N/A',
            purity: {
              value: updatedProduct.purityValue,
              name: updatedProduct.purityValue === 8 ? '18k' : ''
            },
            media: productImages.length
              ? [
                {
                  images: productImages
                }
              ]
              : []
          }
        ]
      };
      // console.log("🚀 ~ orderService ~ changeProductStatus ~ emailOrder:", emailOrder)

      // 7️⃣ Send email based on status
      const recipientEmail = order.userEmail;
      const customerName = order.customerName || 'Customer';

      switch (status) {
        case 'Ready to Ship':
          await sendOrderShippedEmail(
            recipientEmail,
            customerName,
            {
              ...emailOrder,
              courierName: 'Courier Partner',
              trackingNumber: 'N/A',
              trackingLink: 'https://g9jewellery.com'
            }
          );
          break;

        case 'Delivered':
          await sendOrderDeliveredEmail(
            recipientEmail,
            customerName,
            emailOrder
          );
          break;

        case 'Queued':
          await sendOrderInQueueEmail(
            recipientEmail,
            customerName,
            emailOrder
          );
          break;
      }

      return {
        status: true,
        message: 'Product status updated successfully!'
      };

    } catch (err) {
      console.error('Error updating product status:', err);
      return { status: false, message: 'Something went wrong' };
    }
  }




}

export default new orderService()