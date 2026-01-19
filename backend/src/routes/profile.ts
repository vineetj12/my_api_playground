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

    if (!id) {
      return res.status(400).json({ error: "Profile ID is required" });
    }

    // Build update data dynamically
    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    // Handle education
    if (education && Array.isArray(education) && education.length > 0) {
      updateData.education = {
        deleteMany: {},
        create: education.map((ed: any) => {
          // Extract startYear from either startYear field or startDate
          let startYear = ed.startYear;
          if (!startYear && ed.startDate) {
            const year = parseInt(ed.startDate);
            startYear = isNaN(year) ? new Date(ed.startDate).getFullYear() : year;
          }
          startYear = startYear || new Date().getFullYear();

          // Extract endYear from either endYear field or endDate
          let endYear = ed.endYear;
          if (!endYear && ed.endDate && ed.endDate !== '') {
            const year = parseInt(ed.endDate);
            endYear = isNaN(year) ? new Date(ed.endDate).getFullYear() : year;
          }

          return {
            degree: ed.degree || '',
            institution: ed.institution || '',
            startYear: Number(startYear),
            endYear: endYear ? Number(endYear) : null,
          };
        }),
      };
    }

    // Handle skills
    if (skills && Array.isArray(skills) && skills.length > 0) {
      const skillsToCreate = skills
        .map((skill: any) => {
          // Handle if skill is a string
          if (typeof skill === 'string') {
            return skill.trim();
          }
          // Handle if skill is an object with name property
          if (typeof skill === 'object' && skill.name) {
            return skill.name.trim();
          }
          return null;
        })
        .filter((name: any) => name && name !== '');

      if (skillsToCreate.length > 0) {
        updateData.skills = {
          deleteMany: {},
          create: skillsToCreate.map((name: string) => ({
            name,
          })),
        };
      }
    }

    // Handle links
    if (links && typeof links === 'object') {
      const linkEntries = Object.entries(links)
        .filter(([_, value]: [string, any]) => {
          // Handle if value is a string
          if (typeof value === 'string') return value && value !== '';
          // Handle if value is an object with url property
          if (typeof value === 'object' && value.url) return value.url && value.url !== '';
          return false;
        })
        .map(([type, value]: [string, any]) => {
          let url = '';
          if (typeof value === 'string') {
            url = value;
          } else if (typeof value === 'object' && value.url) {
            url = String(value.url);
          }
          return { type, url };
        });
      
      if (linkEntries.length > 0) {
        updateData.links = {
          deleteMany: {},
          create: linkEntries,
        };
      }
    }

    // Update profile with the built data
    const profile = await prisma.profile.update({
      where: { id },
      data: updateData,
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
    res.status(500).json({ error: "Failed to save profile", details: String(error) });
  }
});

export default router;
