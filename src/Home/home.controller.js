import homeService from "./home.service";
import knex from '../common/config/database.config'

class homeController {
  async offerbarlist(req, res) {
    const data = await homeService.offerbarlist()
    res.json({ ...data })
  }

  async mediaList(req, res) {
    const data = await homeService.mediaList(req.query)
    res.json({ ...data })
  }

  // async createlink(req, res) {
  //   const data = await homeService.createLink(req)
  //   res.json({ ...data })
  // }

  // async getSharedProduct(req, res) {
  //   try {
  //     const id = req.params.id;
  //     console.log("Received share ID:", id);

  //     const data = await homeService.getSharedProduct(id);
  //     console.log("Service returned data:", data);

  //     if (data.status && data.url) {
  //       console.log("Redirecting to:", data.url);
  //       return res.redirect(data.url);
  //     }

  //     else {
  //       return res.status(404).json({
  //         status: false,
  //         message: data.message || "Invalid or expired link !!"
  //       });
  //     }
  //   } catch (err) {
  //     console.error("Error in getSharedProduct controller:", err);
  //     return res.status(500).json({
  //       status: false,
  //       message: "Internal server error"
  //     });
  //   }
  // }


  // async getProductById(req, res) {
  //   try {
  //     const { id } = req.params;

  //     const result = await homeService.generateProductDeepLink(id);

  //     return res.status(200).json(result);
  //   }
  //   catch (error) {
  //     console.error("Error generating deep link:", error);
  //     return res.status(500).json({
  //       success: false,
  //       message: "Internal server error",
  //     });
  //   }
  // }

  // async redirectTo(req, res) {
  //   try {
  //     const id = parseInt(req.params.id);

  //     if (isNaN(id)) {
  //       return res.status(400).json({ success: false, message: 'Invalid product ID' });
  //     }

  //     const deepLink = await homeService.getProductRedirectLink(id);

  //     if (!deepLink) {
  //       return res.status(404).json({ success: false, message: 'Product not found' });
  //     }

  //     return res.json({
  //       success: true,
  //       deepLink
  //     });


  //   } catch (err) {
  //     console.error('Redirect error:', err);
  //     return res.status(500).json({ success: false, message: 'Internal server error' });
  //   }
  // }


  async generateLink(req, res) {
    try {
      const { productId } = req.body;
      if (!productId) return res.status(400).json({ message: 'productId is required' });

      const uniqueId = await homeService.generateLink(productId);

      const deepLink = `${process.env.BASE_URL}/user-api/home/link/${uniqueId}`;


      return res.json({
        status: true,
        message: 'Link generated successfully!',
        data: {
          uniqueId,
          deepLink
        }
      });
    }
    catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async redirectLink(req, res) {
    try {
      const { uniqueId } = req.params;
      const productId = await homeService.getProductIdByUniqueId(uniqueId);

      if (!productId) return res.status(404).send('Link not found');

      const frontendUrl = `${process.env.PRODUCT_SHARE_URL}/product-details/${productId}`;

      // console.log('Redirecting uniqueId:', uniqueId);
      // console.log('Resolved productId:', productId);
      // console.log('Redirecting to:', frontendUrl);

      return res.redirect(frontendUrl);
    }
    catch (err) {
      console.error(err);
      res.status(500).send('Internal server error');
    }
  }

  async certificateList(req, res) {
    // req.headers.test = 'test'
    const data = await homeService.certificateList()
    res.json({ ...data })
  }

  async festivalList(req, res) {
    const data = await homeService.festivalList()
    res.json({ ...data })
  }


  async reelsList(req, res) {
    const data = await homeService.reelsList()
    res.json({ ...data })
  }

  async exploreList(req, res) {
    const data = await homeService.exploreList()
    res.json({ ...data })
  }

  async newArrivalList(req, res) {
    const data = await homeService.newArrivalList()
    res.json({ ...data })
  }

  async seoList(req,res){
    const data = await homeService.seoList()
    res.json({...data})
  }

  async seoDetail(req,res){
    const data = await homeService.seoDetail(req.params)
    res.json({...data})
  }

}

export default new homeController();