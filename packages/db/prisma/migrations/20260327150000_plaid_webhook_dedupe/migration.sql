CREATE TABLE "plaid_webhook_dedupes" (
    "body_hash" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plaid_webhook_dedupes_pkey" PRIMARY KEY ("body_hash")
);
