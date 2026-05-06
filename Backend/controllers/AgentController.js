import Agent from "../models/AgentsModel.js";

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const agentAliases = {
  agentid: "agent_ID",
  agent_id: "agent_ID",
  agentname: "Agent_name",
  agent_name: "Agent_name",
  agentcontactnumber: "Agent_contact_number",
  agent_contact_number: "Agent_contact_number",
  contactnumber: "Agent_contact_number",
  contact_number: "Agent_contact_number",
  agentaadharno: "Agent_aadhar_No",
  agent_aadhar_no: "Agent_aadhar_No",
  agentvehicleno: "Agent_vehicle_no",
  agent_vehicle_no: "Agent_vehicle_no",
  commissiontype: "Agent_commission_type",
  agent_commission_type: "Agent_commission_type",
  commissionamount: "Agent_commission_amount",
  agent_commission_amount: "Agent_commission_amount",
  agentremark: "Agent_remark",
  agent_remark: "Agent_remark",
  status: "status",
};

const mapAgentRow = (row) => {
  const mappedRow = {};
  Object.entries(row || {}).forEach(([header, rawValue]) => {
    const targetField = agentAliases[normalizeHeader(header)];
    if (!targetField) return;
    if (rawValue !== null && typeof rawValue !== "undefined" && String(rawValue).trim() !== "") {
      mappedRow[targetField] = String(rawValue).trim();
    }
  });
  return mappedRow;
};

const getNextAgentCode = async () => {
  const latestAgent = await Agent.findOne().sort({ createdAt: -1, agent_ID: -1 }).lean();
  const lastCode = latestAgent?.agent_ID || "AGT00000";
  const lastNumber = parseInt(String(lastCode).replace("AGT", ""), 10) || 0;
  return `AGT${String(lastNumber + 1).padStart(5, "0")}`;
};

const getAgentMatch = async (mappedRow) => {
  if (mappedRow.agent_ID) {
    const existingAgent = await Agent.findOne({ agent_ID: mappedRow.agent_ID });
    if (existingAgent) {
      return { existingAgent, matchReason: `Matched by agent_ID ${mappedRow.agent_ID}` };
    }
  }

  if (mappedRow.Agent_aadhar_No) {
    const existingAgent = await Agent.findOne({ Agent_aadhar_No: mappedRow.Agent_aadhar_No });
    if (existingAgent) {
      return {
        existingAgent,
        matchReason: `Matched by Agent_aadhar_No ${mappedRow.Agent_aadhar_No}`,
      };
    }
  }

  if (mappedRow.Agent_contact_number && mappedRow.Agent_name) {
    const existingAgent = await Agent.findOne({
      Agent_contact_number: mappedRow.Agent_contact_number,
      Agent_name: mappedRow.Agent_name,
    });
    if (existingAgent) {
      return {
        existingAgent,
        matchReason: `Matched by Agent_contact_number ${mappedRow.Agent_contact_number} and Agent_name ${mappedRow.Agent_name}`,
      };
    }
  }

  return { existingAgent: null, matchReason: null };
};

const analyzeAgentRows = async (rows, { persist = false, forceCreate = false } = {}) => {
  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const skippedRows = [];
  const rowResults = [];

  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2;
    const mappedRow = mapAgentRow(rows[index]);

    if (!mappedRow.Agent_name && !mappedRow.Agent_contact_number && !mappedRow.agent_ID) {
      const reason = "Missing identifying agent data";
      skippedCount += 1;
      skippedRows.push({ rowNumber, reason });
      rowResults.push({ rowNumber, action: "skip", reason, label: "" });
      continue;
    }

    try {
      const { existingAgent, matchReason } = forceCreate
        ? { existingAgent: null, matchReason: "Force create mode enabled" }
        : await getAgentMatch(mappedRow);

      if (existingAgent && !forceCreate) {
        if (persist) {
          Object.entries(mappedRow).forEach(([field, value]) => {
            if (typeof value !== "undefined") existingAgent[field] = value;
          });
          await existingAgent.save();
        }
        updatedCount += 1;
        rowResults.push({ rowNumber, action: "update", reason: matchReason, label: mappedRow.Agent_name || existingAgent.Agent_name || "" });
        continue;
      }

      if (persist) {
        await Agent.create({
          agent_ID: forceCreate || !mappedRow.agent_ID ? await getNextAgentCode() : mappedRow.agent_ID,
          ...mappedRow,
        });
      }

      insertedCount += 1;
      rowResults.push({
        rowNumber,
        action: "insert",
        reason: forceCreate ? "Force create mode enabled" : "New agent will be inserted",
        label: mappedRow.Agent_name || "",
      });
    } catch (error) {
      skippedCount += 1;
      skippedRows.push({ rowNumber, reason: error.message });
      rowResults.push({ rowNumber, action: "skip", reason: error.message, label: mappedRow.Agent_name || "" });
    }
  }

  return {
    insertedCount,
    updatedCount,
    skippedCount,
    skippedRows,
    rowResults,
    note: forceCreate
      ? "Force create mode inserts every imported agent row as a new record."
      : "Matching agent rows update existing agents; non-matching rows are inserted.",
  };
};

const createAgent = async (req, res) => {
  try {
    const newCode = await getNextAgentCode();

    const agent = new Agent({
      agent_ID: newCode,
      ...req.body,
    });

    await agent.save();

    return res
      .status(200)
      .json({ success: true, message: "Agent created successfully", agent });
  } catch (error) {
    console.error("Error creating agent:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create agent ",
      error: error.message,
    });
  }
};

const getAllAgents = async (req, res) => {
  try {
    const agents = await Agent.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Agents fetched successfully",
      data: agents,
    });
  } catch (error) {
    console.error("Error fetching agents:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch agents",
      error: error.message,
    });
  }
};

const previewAgentsImport = async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    const forceCreate = Boolean(req.body?.forceCreate);
    if (!rows.length) {
      return res.status(400).json({ success: false, message: "No rows found in the uploaded sheet" });
    }
    const preview = await analyzeAgentRows(rows, { persist: false, forceCreate });
    return res.status(200).json({ success: true, message: "Agent import preview generated", ...preview });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to preview agents import", error: error.message });
  }
};

const importAgents = async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    const forceCreate = Boolean(req.body?.forceCreate);
    if (!rows.length) {
      return res.status(400).json({ success: false, message: "No rows found in the uploaded sheet" });
    }
    const result = await analyzeAgentRows(rows, { persist: true, forceCreate });
    return res.status(200).json({ success: true, message: "Agents import completed", ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to import agents", error: error.message });
  }
};

export { createAgent, getAllAgents, previewAgentsImport, importAgents };
