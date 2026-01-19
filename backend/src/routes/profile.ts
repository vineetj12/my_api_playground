import { Router } from "express";
import { prisma } from "../prisma";
import { middleware } from "../middleware";

const router = Router();


router.get("/", async (req, res) => {
  try {
    const profile = await prisma.profile.findFirst({
      include: {
        education: true,
        skills: true,
        projects: true,
        links: true,
      },
    });

    res.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.post("/", middleware, async (req, res) => {
  try {
    const { id, name, email, education, skills, links } = req.body;

    // Update existing profile by ID
    const profile = await prisma.profile.update({
      where: { id },
      data: {
        name,
        email,
        education: education ? {
          deleteMany: {},
          create: education.map((ed: any) => ({
            degree: ed.degree,
            institution: ed.institution,
            startYear: parseInt(ed.startYear) || new Date(ed.startDate).getFullYear(),
            endYear: ed.endYear ? parseInt(ed.endYear) : (ed.endDate ? new Date(ed.endDate).getFullYear() : null),
          })),
        } : undefined,
        skills: skills ? {
          deleteMany: {},
          create: skills.map((skill: string) => ({
            name: skill,
          })),
        } : undefined,
        links: links ? {
          deleteMany: {},
          create: Object.entries(links).map(([type, url]: [string, any]) => ({
            type,
            url,
          })),
        } : undefined,
      },
      include: {
        education: true,
        skills: true,
        projects: true,
        links: true,
      },
    });

    res.json(profile);
  } catch (error) {
    console.error("Error saving profile:", error);
    res.status(500).json({ error: "Failed to save profile" });
  }
});

export default router;
