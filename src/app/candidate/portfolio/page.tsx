"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Grid12, Col } from "@/components/app/Grid";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { PortfolioBuilder } from "@/components/portfolio/PortfolioBuilder";
import { CVPreview } from "@/components/portfolio/CVPreview";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { usePortfolio } from "@/lib/hooks/usePortfolio";

export default function PortfolioPage() {
  return (
    <AppShell>
      <PortfolioContent />
    </AppShell>
  );
}

function PortfolioContent() {
  const { portfolio, resetPortfolio } = usePortfolio();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const hasContent = portfolio.totalAdditions > 0;

  return (
    <>
      <PageHeader
        backHref="/candidate/dashboard"
        backLabel="Back to dashboard"
        eyebrow="Living Portfolio"
        title="Build your CV — in real time"
        description="Edit any section on the left and watch your CV update on the right. Everything is saved locally and follows you to every page."
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowResetConfirm(true)}
            disabled={!hasContent}
          >
            <RotateCcw className="size-3.5" />
            Reset portfolio
          </Button>
        }
      />

      <section className="px-4 py-8 sm:py-12">
        <Grid12>
          <Col span={12} lg={6}>
            <PortfolioBuilder />
          </Col>
          <Col span={12} lg={6}>
            <div className="lg:sticky lg:top-24">
              <CVPreview />
            </div>
          </Col>
        </Grid12>
      </section>

      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset your Living Portfolio?"
        description={`This will permanently delete all ${portfolio.totalAdditions} ${
          portfolio.totalAdditions === 1 ? "entry" : "entries"
        }. This cannot be undone.`}
        confirmLabel="Yes, reset portfolio"
        cancelLabel="Keep my portfolio"
        onConfirm={() => {
          resetPortfolio();
          setShowResetConfirm(false);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </>
  );
}
