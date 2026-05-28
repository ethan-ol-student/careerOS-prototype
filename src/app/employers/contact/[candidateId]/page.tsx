"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import EmployerAppShell from "@/components/employer/EmployerAppShell";
import { ContactForm } from "@/components/marketplace/ContactForm";
import { findCandidateById } from "@/lib/candidates/data";

interface PageProps {
  params: Promise<{ candidateId: string }>;
}

export default function EmployerContactPage({ params }: PageProps) {
  const { candidateId } = use(params);
  const candidate = findCandidateById(candidateId);
  if (!candidate) notFound();

  return (
    <EmployerAppShell>
      <main className="px-4 pb-16 pt-8">
        <div className="max-w-container mx-auto">
          <ContactForm candidate={candidate} />
        </div>
      </main>
    </EmployerAppShell>
  );
}
