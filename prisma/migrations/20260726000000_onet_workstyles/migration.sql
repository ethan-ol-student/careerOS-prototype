-- O*NET occupations + work styles (Career Intelligence, slice 3).
-- Adds MarketPosting.socCode + four new tables. No existing data changed.

ALTER TABLE "MarketPosting" ADD COLUMN "socCode" TEXT;
CREATE INDEX "MarketPosting_socCode_idx" ON "MarketPosting"("socCode");

CREATE TABLE "Occupation" (
    "socCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Occupation_pkey" PRIMARY KEY ("socCode")
);

CREATE TABLE "OccupationWorkStyle" (
    "id" TEXT NOT NULL,
    "socCode" TEXT NOT NULL,
    "elementName" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    CONSTRAINT "OccupationWorkStyle_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OccupationWorkStyle_socCode_elementName_key" ON "OccupationWorkStyle"("socCode", "elementName");
CREATE INDEX "OccupationWorkStyle_socCode_idx" ON "OccupationWorkStyle"("socCode");

CREATE TABLE "OccupationTitleAlias" (
    "id" TEXT NOT NULL,
    "socCode" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    CONSTRAINT "OccupationTitleAlias_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OccupationTitleAlias_normalized_idx" ON "OccupationTitleAlias"("normalized");
CREATE INDEX "OccupationTitleAlias_socCode_idx" ON "OccupationTitleAlias"("socCode");

CREATE TABLE "FieldWorkStyle" (
    "id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "elementName" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "occupations" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "FieldWorkStyle_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FieldWorkStyle_field_elementName_key" ON "FieldWorkStyle"("field", "elementName");
CREATE INDEX "FieldWorkStyle_field_idx" ON "FieldWorkStyle"("field");

-- FK constraints (match Prisma's onDelete: Cascade)
ALTER TABLE "OccupationWorkStyle" ADD CONSTRAINT "OccupationWorkStyle_socCode_fkey" FOREIGN KEY ("socCode") REFERENCES "Occupation"("socCode") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OccupationTitleAlias" ADD CONSTRAINT "OccupationTitleAlias_socCode_fkey" FOREIGN KEY ("socCode") REFERENCES "Occupation"("socCode") ON DELETE CASCADE ON UPDATE CASCADE;
