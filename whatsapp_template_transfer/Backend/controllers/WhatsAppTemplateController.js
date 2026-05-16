import WhatsAppTemplate from "../models/WhatsAppTemplateModel.js";

// Extract {{variable}} names from a template body
const extractVariables = (body) => {
  const matches = body.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map((m) => m.replace(/[{}]/g, "")))];
};

/** GET /api/v1/whatsapp/templates */
export const getTemplates = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";

    const templates = await WhatsAppTemplate.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: templates });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /api/v1/whatsapp/templates/:id */
export const getTemplateById = async (req, res) => {
  try {
    const template = await WhatsAppTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: "Template not found" });
    return res.status(200).json({ success: true, data: template });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** POST /api/v1/whatsapp/templates */
export const createTemplate = async (req, res) => {
  try {
    const { name, category, body, isActive } = req.body;

    if (!name?.trim() || !body?.trim()) {
      return res.status(400).json({ success: false, message: "name and body are required" });
    }

    const variables = extractVariables(body);

    const template = await WhatsAppTemplate.create({
      name: name.trim(),
      category: category || "custom",
      body: body.trim(),
      variables,
      isActive: isActive !== undefined ? isActive : true,
    });

    return res.status(201).json({ success: true, message: "Template created", data: template });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Template name already exists" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** PUT /api/v1/whatsapp/templates/:id */
export const updateTemplate = async (req, res) => {
  try {
    const { name, category, body, isActive } = req.body;

    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (category !== undefined) update.category = category;
    if (isActive !== undefined) update.isActive = isActive;
    if (body !== undefined) {
      update.body = body.trim();
      update.variables = extractVariables(body);
    }

    const template = await WhatsAppTemplate.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!template) return res.status(404).json({ success: false, message: "Template not found" });
    return res.status(200).json({ success: true, message: "Template updated", data: template });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Template name already exists" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/** DELETE /api/v1/whatsapp/templates/:id */
export const deleteTemplate = async (req, res) => {
  try {
    const template = await WhatsAppTemplate.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: "Template not found" });
    return res.status(200).json({ success: true, message: "Template deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
