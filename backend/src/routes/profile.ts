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

    // Step 1: Delete related records first
    await prisma.education.deleteMany({
      where: { profileId: id }
    });
    await prisma.skill.deleteMany({
      where: { profileId: id }
    });
    await prisma.link.deleteMany({
      where: { profileId: id }
    });

    // Step 2: Build update data for profile fields only
    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    // Step 3: Update profile with just the basic fields
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

    // Step 4: Create education records
    if (education && Array.isArray(education) && education.length > 0) {
      const eduData = education.map((ed: any) => {
        let startYear = ed.startYear;
        if (!startYear && ed.startDate) {
          const year = parseInt(ed.startDate);
          startYear = isNaN(year) ? new Date(ed.startDate).getFullYear() : year;
        }
        startYear = startYear || new Date().getFullYear();

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
          profileId: id,
        };
      });
      
      await prisma.education.createMany({
        data: eduData,
      });
    }

    // Step 5: Create skill records
    if (skills && Array.isArray(skills) && skills.length > 0) {
      const skillsToCreate = skills
        .map((skill: any) => {
          if (typeof skill === 'string') {
            return skill.trim();
          }
          if (typeof skill === 'object' && skill.name) {
            return skill.name.trim();
          }
          return null;
        })
        .filter((name: any) => name && name !== '');

      if (skillsToCreate.length > 0) {
        const skillData = skillsToCreate.map((name: string) => ({
          name,
          profileId: id,
        }));
        
        await prisma.skill.createMany({
          data: skillData,
        });
      }
    }

    // Step 6: Create link records
    if (links && typeof links === 'object') {
      const linkEntries = Object.entries(links)
        .filter(([_, value]: [string, any]) => {
          if (typeof value === 'string') return value && value !== '';
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
          return { type, url, profileId: id };
        });
      
      if (linkEntries.length > 0) {
        await prisma.link.createMany({
          data: linkEntries,
        });
      }
    }

    // Step 7: Fetch and return updated profile with all relations
    const updatedProfile = await prisma.profile.findUnique({
      where: { id },
      include: {
        education: true,
        skills: true,
        projects: true,
        links: true,
      },
    });

    res.json(updatedProfile);
  } catch (error) {
    console.error("Error saving profile:", error);
    res.status(500).json({ error: "Failed to save profile", details: String(error) });
  }
});

export default router;
