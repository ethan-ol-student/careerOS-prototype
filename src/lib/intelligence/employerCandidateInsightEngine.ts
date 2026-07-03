/**
 * Employer-side candidate insight (signal map): strengths, risks, a hiring
 * confidence score, and an interview kit — all deterministic from visible
 * profile signals, each with the "why" attached. No hidden weights.
 */
import type { Candidate } from "@/lib/candidates/types";
import { clampScore, type ScoreResult } from "./scoringConfig";

export interface CandidateInsight extends ScoreResult {
  /** score = hiring confidence, 0–100. */
  strengths: string[];
  risks: string[];
  /** Interview questions targeted at the SPECIFIC risks/strengths found. */
  interviewKit: string[];
}

export function candidateInsight(c: Candidate): CandidateInsight {
  const strengths: string[] = [];
  const risks: string[] = [];
  const kit: string[] = [];

  // Confidence buckets (named, visible): evidence 40, momentum 25,
  // readiness 20, reachability 15.
  let confidence = 0;

  const projects = c.portfolioProjects.length;
  const evidence = Math.min(40, projects * 15 + c.topSkills.length * 2);
  confidence += evidence;
  if (projects >= 2) {
    strengths.push(`${projects} portfolio projects — verifiable work, not just claims.`);
    kit.push(`Walk me through "${c.portfolioProjects[0]}" — what was genuinely hard about it?`);
  } else if (projects === 1) {
    strengths.push(`1 portfolio project backs up the profile.`);
    kit.push(`Deep-dive "${c.portfolioProjects[0]}": what would you rebuild differently now?`);
  } else {
    risks.push("No portfolio evidence yet — skills are self-reported only.");
    kit.push(`Ask for a concrete artifact: "Show me something you've made that demonstrates ${c.topSkills[0] ?? "your top skill"}."`);
  }

  const momentum =
    c.growthSignal === "Accelerating" || c.growthSignal === "Compounding"
      ? 25
      : c.growthSignal === "Steady"
        ? 17
        : 8;
  confidence += momentum;
  if (momentum >= 17) {
    strengths.push(`"${c.growthSignal}" growth signal — actively adding skills.`);
  } else {
    risks.push(`Growth signal is "${c.growthSignal}" — probe current learning momentum.`);
    kit.push("What's the last skill you deliberately learned, and how?");
  }

  confidence += Math.round((c.readinessScore / 100) * 20);
  if (c.readinessScore >= 70) {
    strengths.push(`Readiness ${c.readinessScore}/100 — profile fundamentals in place.`);
  } else {
    risks.push(`Readiness ${c.readinessScore}/100 — expect gaps in profile fundamentals.`);
  }

  const reachable = /actively|open/i.test(c.availability);
  confidence += reachable ? 15 : 7;
  if (reachable) {
    strengths.push(`Availability: ${c.availability}.`);
  } else {
    risks.push(`Availability is "${c.availability}" — timeline may not match your req.`);
    kit.push("What timeline are you actually working with for a move?");
  }

  // Always end the kit with a strengths-based opener.
  kit.push(
    `Their stated direction is "${c.careerDirection}" — ask what the ideal next role looks like and check it matches yours.`,
  );

  return {
    score: clampScore(confidence),
    strengths,
    risks,
    interviewKit: kit,
    reasons: [
      `Evidence ${evidence}/40 · momentum ${momentum}/25 · readiness ${Math.round((c.readinessScore / 100) * 20)}/20 · reachability ${reachable ? 15 : 7}/15.`,
      ...strengths.slice(0, 2),
    ],
    uncertainty:
      "Built from self-reported profile signals — verify with the interview kit, not the score.",
  };
}
