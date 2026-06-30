# Mobile pass — Week 1 (start)

Scope-boxed per the slippage backup: this is the **start**. Infra + a couple of
concrete fixes are done; the per-page audit continues in the Day-7 buffer.

## Done (this pass)

- **Explicit responsive viewport** (`width=device-width, initial-scale=1`,
  no zoom lock) in `src/app/layout.tsx`.
- **Mobile-first loading skeletons** — single column on phones, 12-col at `md+`
  (`PageSkeleton` in `src/components/ui/Skeleton.tsx`, wired via segment
  `loading.tsx`).
- **Session-timeout banner** is responsive (full-width inset on phones, pinned
  bottom-right at `sm+`).
- **App header** — the "· Candidate" sub-label hides under `sm` so the brand +
  bell + menu never crowd on narrow screens.

## Remaining (buffer / Week 4)

Audit each at 360px and 768px:

- [ ] `/candidate/dashboard` phase widgets — confirm every `Grid12` card reflows
      to one column (spot-check Mid-Career decay matrix + Skill Evolution).
- [ ] `/employers/marketplace` — filter bar + candidate cards on phones.
- [ ] `/candidate/portfolio` builder — multi-column form sections.
- [ ] Onboarding flows (candidate + employer) — step nav + long option lists.
- [ ] Messages / chat panes — input + thread height on mobile keyboards.
- [ ] Tables/horizontal scrollers — wrap any fixed-width row in `overflow-x-auto`.
- [ ] Tap targets ≥ 44px on icon-only buttons.

No layout primitives need changing — `Grid12`/`Col` already take `span/md/lg`;
the work is verifying and adding the responsive prefixes where missing.
