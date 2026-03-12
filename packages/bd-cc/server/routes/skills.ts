import express from "express";
import {
  scanSkills,
  getSkillsConfig,
  saveSkillsConfig,
  installSkillFromGit,
  updateSkillFromGit,
  uninstallSkill,
} from "../utils/skill-loader";

const router = express.Router();

// GET / — List all installed skills
router.get("/", (_req, res) => {
  try {
    const skills = scanSkills();
    res.json({ skills });
  } catch (err) {
    res.status(500).json({ error: "Failed to scan skills", details: (err as Error).message });
  }
});

// GET /:name/manifest — Get single skill manifest
router.get("/:name/manifest", (req, res) => {
  try {
    if (!/^[a-zA-Z0-9_-]+$/.test(req.params.name)) {
      return res.status(400).json({ error: "Invalid skill name" });
    }
    const skills = scanSkills();
    const skill = skills.find((s) => s.name === req.params.name);
    if (!skill) {
      return res.status(404).json({ error: "Skill not found" });
    }
    res.json(skill);
  } catch (err) {
    res.status(500).json({ error: "Failed to read skill manifest", details: (err as Error).message });
  }
});

// PUT /:name/enable — Toggle skill enabled/disabled
router.put("/:name/enable", (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== "boolean") {
      return res.status(400).json({ error: '"enabled" must be a boolean' });
    }

    const skills = scanSkills();
    const skill = skills.find((s) => s.name === req.params.name);
    if (!skill) {
      return res.status(404).json({ error: "Skill not found" });
    }

    const config = getSkillsConfig();
    config[req.params.name] = { ...config[req.params.name], enabled };
    saveSkillsConfig(config);

    res.json({ success: true, name: req.params.name, enabled });
  } catch (err) {
    res.status(500).json({ error: "Failed to update skill", details: (err as Error).message });
  }
});

// POST /install — Install skill from git URL
router.post("/install", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: '"url" is required and must be a string' });
    }

    if (!url.startsWith("https://") && !url.startsWith("git@")) {
      return res.status(400).json({ error: "URL must start with https:// or git@" });
    }

    const skill = await installSkillFromGit(url);
    res.json({ success: true, skill });
  } catch (err) {
    res.status(400).json({ error: "Failed to install skill", details: (err as Error).message });
  }
});

// POST /:name/update — Pull latest from git
router.post("/:name/update", async (req, res) => {
  try {
    const skillName = req.params.name;

    if (!/^[a-zA-Z0-9_-]+$/.test(skillName)) {
      return res.status(400).json({ error: "Invalid skill name" });
    }

    const skill = await updateSkillFromGit(skillName);
    res.json({ success: true, skill });
  } catch (err) {
    res.status(400).json({ error: "Failed to update skill", details: (err as Error).message });
  }
});

// DELETE /:name — Uninstall skill
router.delete("/:name", async (req, res) => {
  try {
    const skillName = req.params.name;

    if (!/^[a-zA-Z0-9_-]+$/.test(skillName)) {
      return res.status(400).json({ error: "Invalid skill name" });
    }

    await uninstallSkill(skillName);
    res.json({ success: true, name: skillName });
  } catch (err) {
    res.status(400).json({ error: "Failed to uninstall skill", details: (err as Error).message });
  }
});

export default router;
