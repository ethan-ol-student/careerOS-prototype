import { redirect } from "next/navigation";

/** The Resume page merged into the Living Portfolio — keep old links alive. */
export default function ResumeRedirect() {
  redirect("/candidate/portfolio");
}
