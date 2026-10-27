-- CreateTable
CREATE TABLE "rate_limits" (
    "bucket" TEXT NOT NULL,
    "window_start" TIMESTAMPTZ(6) NOT NULL,
    "hits" INTEGER NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("bucket")
);
