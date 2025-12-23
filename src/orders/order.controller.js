
import orderService from './order.service'
import knex from '../common/config/database.config'

class orderController {

  async list(req, res) {
    const { statusFilter } = req.query
    const data = await orderService.list(req.user, statusFilter, req.query)
    res.json({ ...data })
  }

  async addressDetail(req, res) {
    const data = await orderService.addressDetail(req.body, req.user)
    res.json({ ...data })
  }

  async details(req, res) {
    const data = await orderService.details(req.user, req.params)
    res.json({ ...data })
  }

  async Cancelled(req, res) {
    const data = await orderService.Cancelled(req.body)
    res.json({ ...data })
  }

  async alldetails(req, res) {
    const data = await orderService.alldetails(req.params, req.query)
    res.json({ ...data })
  }

  // async generateInvoice(req, res) {
  //   const data = await orderService.generateInvoice(req.user, req.body, req.params.id, req.file);
  //   res.json({ ...data });
  // }

  async createInvoice(req, res) {
    const data = await orderService.createInvoice(req.body)
    res.json({ ...data })
  }

  async getInvoice(req, res) {
    const data = await orderService.getInvoice(req.user)
    res.json({ ...data })
  }

  async downloadInvoice(req, res) {
    try {
      const { orderId } = req.body;
      console.log("Downloading invoice for Order:", orderId);

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
          message: "Invoice not found for this order !!"
        });
      }

      if (!invoiceData.invoice) {
        return res.json({
          status: false,
          message: "Invoice file missing in DB"
        });
      }

      const invoiceFile = invoiceData.invoice;

      // const baseUrl = process.env.INVOICE_URL;
      const fileUrl = `${process.env.INVOICE_URL}/${invoiceFile}`;


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


}

export default new orderController()