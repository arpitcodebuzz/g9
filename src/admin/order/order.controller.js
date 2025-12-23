import orderService from './order.service'
import knex from '../../common/config/database.config'

class orderController {
  async list(req, res) {
    const data = await orderService.list(req.query)
    res.json({ ...data })
  }


  async subInvoice(req, res) {
    const data = await orderService.subInvoice(req.body, res)
    // res.json({ ...data })
  }

  async listOrder(req, res) {
    const data = await orderService.listOrder(req.params)
    res.json({ ...data })
  }

  async detail(req, res) {
    const data = await orderService.detail(req.params)
    res.json({ ...data })
  }

  async shareInvoice(req, res) {
    const data = await orderService.shareInvoice(req.body)
    res.json({ ...data })
  }

  async downloadInvoice(req, res) {
    try {
      const { orderId } = req.body;
      // console.log("Downloading invoice for Order:", orderId);

      if (!orderId) {
        return res.status(400).json({
          status: false,
          message: "orderId is required"
        });
      }

      const invoiceData = await knex("invoices")
        .where("orderId", orderId)
        .first();

      // console.log("Invoice Row:", invoiceData);

      if (!invoiceData) {
        return res.json({
          status: false,
          message: "Invoice not found for this order"
        });
      }

      if (!invoiceData.invoice) {
        return res.json({
          status: false,
          message: "Invoice file missing in DB"
        });
      }

      const invoiceFile = invoiceData.invoice;

      const baseUrl = process.env.INVOICE_URL;
      const fileUrl = `${baseUrl}/${invoiceFile}`;

      // console.log("File URL:", fileUrl);

      const file = await fetch(fileUrl);
      const blob = await file.arrayBuffer();

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "application/pdf");

      res.send(Buffer.from(blob));

    } catch (error) {
      console.error("Download Invoice Error:", error);
      return res.status(500).json({
        status: false,
        message: "Error downloading invoice",
        error: error.message,
      });
    }
  }

  async downloadSubInvoice(req, res) {
    try {
      const { id, orderId } = req.body;
      // console.log("Downloading invoice for Order:", orderId, id);

      if (!orderId) {
        return res.status(400).json({
          status: false,
          message: "orderId is required"
        });
      }

      const SubinvoiceData = await knex("subInvoice")
        .where({ id: id, orderId: orderId })
        .first();


      if (!SubinvoiceData) {
        return res.json({
          status: false,
          message: "Invoice not found for this order"
        });
      }

      if (!SubinvoiceData.subInvoice) {
        return res.json({
          status: false,
          message: "Invoice file missing in DB"
        });
      }

      const SubinvoiceFile = SubinvoiceData.subInvoice;

      const baseUrl = process.env.INVOICE_URL;
      const fileUrl = `${baseUrl}/${SubinvoiceFile}`;


      const file = await fetch(fileUrl);
      const blob = await file.arrayBuffer();

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "application/pdf");

      res.send(Buffer.from(blob));

    } catch (error) {
      console.error("Download Invoice Error:", error);
      return res.status(500).json({
        status: false,
        message: "Error downloading invoice",
        error: error.message,
      });
    }
  }




  async getInvoice(req, res) {
    const data = await orderService.getInvoice()
    res.json({ ...data })
  }

  async getSubInvoice(req, res) {
    const data = await orderService.getSubInvoice(req.params)
    res.json({ ...data })
  }

  async changeProductStatus(req, res) {
    const data = await orderService.changeProductStatus(req.body)
    res.json({ ...data })
  }

}

export default new orderController()