-- PlaidItem + linked_accounts FK refactor (existing linked rows without items are removed).
CREATE TABLE "plaid_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "plaid_item_id" TEXT NOT NULL,
    "access_token_enc" TEXT NOT NULL,
    "transactions_cursor" TEXT,
    "last_successful_sync_at" TIMESTAMP(3),
    "last_sync_error" TEXT,
    "last_sync_error_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plaid_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plaid_items_plaid_item_id_key" ON "plaid_items"("plaid_item_id");
CREATE INDEX "plaid_items_user_id_idx" ON "plaid_items"("user_id");

ALTER TABLE "plaid_items" ADD CONSTRAINT "plaid_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plaid_items" ADD CONSTRAINT "plaid_items_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "linked_accounts_plaid_item_id_plaid_account_id_key";

ALTER TABLE "linked_accounts" ADD COLUMN "plaid_item_record_id" TEXT;
ALTER TABLE "linked_accounts" ADD COLUMN "last_balance_sync_at" TIMESTAMP(3);
ALTER TABLE "linked_accounts" ADD COLUMN "last_transaction_sync_at" TIMESTAMP(3);

ALTER TABLE "linked_accounts" DROP COLUMN "plaid_item_id";

DELETE FROM "linked_accounts" WHERE "plaid_item_record_id" IS NULL;

ALTER TABLE "linked_accounts" ALTER COLUMN "plaid_item_record_id" SET NOT NULL;

ALTER TABLE "linked_accounts" ADD CONSTRAINT "linked_accounts_plaid_item_record_id_fkey" FOREIGN KEY ("plaid_item_record_id") REFERENCES "plaid_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "linked_accounts_plaid_item_record_id_plaid_account_id_key" ON "linked_accounts"("plaid_item_record_id", "plaid_account_id");
CREATE INDEX "linked_accounts_plaid_item_record_id_idx" ON "linked_accounts"("plaid_item_record_id");
