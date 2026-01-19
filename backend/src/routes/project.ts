import { Router } from "express";
import { prisma } from "../prisma";
import { middleware } from "../middleware";

const router = Router();


router.get("/", async (req, res) => {
  try {
    const skill = req.query.skill as string | undefined;

    const projects = await prisma.project.findMany({
      where: skill
        ? {
            skills: {
              some: {
                skill: {
                  name: {
                    equals: skill,
                  },
                },
              },
            },
          }
        : {},
      include: {
        skills: { include: { skill: true } },
        links: true,
      },
    });

    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

/**
 * POST /projects (protected)
 * Create a new project
 */
router.post("/", middleware, async (req, res) => {
  try {
    const { title, description, work, profileId } = req.body;

    if (!title || !profileId) {
      return res.status(400).json({ error: "Title and profileId are required" });
    }

    const project = await prisma.project.create({
      data: {
        title,
        description: description || "",
        work: work || "Personal Project",
        profileId,
      },
      include: {
        skills: { include: { skill: true } },
        links: true,
      },
    });

    res.json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

/**
 * POST /projects/from-github (protected)
 * Body: { githubUrl: "https://github.com/username/repo", profileId: "..." }
 */
router.post("/from-github", middleware, async (req, res) => {
  try {
    const { githubUrl, profileId } = req.body;

    if (!githubUrl || !profileId) {
      return res.status(400).json({ error: "GitHub URL and profileId are required" });
    }

    // Parse GitHub URL to extract repo name
    const urlParts = githubUrl.split("/");
    const repoName = urlParts[urlParts.length - 1].replace(".git", "");
    const ownerName = urlParts[urlParts.length - 2];

    const project = await prisma.project.create({
      data: {
        title: repoName,
        description: `GitHub project: ${ownerName}/${repoName}`,
        work: "Open Source",
        profileId,
        links: {
          create: [
            {
              type: "github",
              url: githubUrl,
            },
          ],
        },
      },
      include: {
        skills: { include: { skill: true } },
        links: true,
      },
    });

    res.json(project);
  } catch (error) {
    console.error("Error creating project from GitHub:", error);
    res.status(500).json({ error: "Failed to create project from GitHub" });
  }
});

export default router;
