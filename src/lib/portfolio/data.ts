export type PortfolioSection = "bio" | "skill" | "experience" | "aspiration" | "reflection";

export interface ConversationStep {
  id: string;
  aiPrompt: string;
  placeholder: string;
  targetSection: PortfolioSection;
  followUp: string;
}

export const conversationFlow: ConversationStep[] = [
  {
    id: "bio",
    aiPrompt: "Hi — I am here to help you build a portfolio that actually tells your story. Let us start simple. In one sentence, who are you and what do you do right now?",
    placeholder: "e.g. Software engineer focused on developer tooling at a fintech startup",
    targetSection: "bio",
    followUp: "Got it. I have set that as your headline — this is what employers and mentors will see first.",
  },
  {
    id: "experience",
    aiPrompt: "Tell me about a project or role you have worked on recently that you are proud of. What did you build, contribute, or learn?",
    placeholder: "e.g. I led the migration of our payment system from monolith to microservices...",
    targetSection: "experience",
    followUp: "Captured. That is strong context — concrete work always reads better than a job title.",
  },
  {
    id: "skill",
    aiPrompt: "What is a skill you have actively developed in the last six months? Could be technical, strategic, or interpersonal.",
    placeholder: "e.g. Got significantly better at technical writing through documenting our APIs",
    targetSection: "skill",
    followUp: "Added to your skills. Career OS will track how this develops over time.",
  },
  {
    id: "aspiration",
    aiPrompt: "Where do you want to be 12 months from now, if everything goes well? Do not overthink it — first thing that comes to mind.",
    placeholder: "e.g. Leading a small team and shipping products that real people use",
    targetSection: "aspiration",
    followUp: "Saved as a near-term aspiration. We will reference this when surfacing career path options.",
  },
  {
    id: "reflection",
    aiPrompt: "What is something about your career thinking that has shifted recently? A belief you have updated, a path you have reconsidered.",
    placeholder: "e.g. I used to think management was the only growth path. Now I see staff engineering differently.",
    targetSection: "reflection",
    followUp: "Important context. These reflections are what makes a portfolio living rather than static.",
  },
];

export const restartPrompt: ConversationStep = {
  id: "continue",
  aiPrompt: "Beautiful — your portfolio has the bones. Want to keep going? Add anything else: a new skill, a new project, a goal, a thought. I will sort it into the right section.",
  placeholder: "Add anything you would like — a new skill, project, goal, or reflection",
  targetSection: "reflection",
  followUp: "Added. Your portfolio is genuinely living now — come back whenever something changes.",
};