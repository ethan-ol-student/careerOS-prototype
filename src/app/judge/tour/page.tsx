import type { Metadata } from "next";
import { requireJudgeAccount } from "@/lib/judge/access";
import { JudgeTourClient } from "./tour-client";

export const metadata: Metadata = {
  title: "Judge Tour - CareerOS",
  description: "Judge-only CareerOS product walkthrough.",
};

export default async function JudgeTourPage() {
  await requireJudgeAccount();
  return <JudgeTourClient />;
}
