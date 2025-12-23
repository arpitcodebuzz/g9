import subcategoryService from '../sub-category/subcategory.service'

class subCategoryClt {
  async add(req, res) {
    const data = await subcategoryService.add(req.body)
    res.json({ ...data })
  }

  async list(req, res) {
    const data = await subcategoryService.list()
    res.json({ ...data })
  }

  async delete(req, res) {
    const data = await subcategoryService.delete(req.params)
    res.json({ ...data })
  }

  async edit(req, res) {
    const data = await subcategoryService.edit(req.body, req.params)
    res.json({ ...data })
  }

    async detail(req, res) {
    const data = await subcategoryService.detail(req.params)
    res.json({ ...data })
  }
}

export default new subCategoryClt()