CREATE TABLE "recurring_exclusions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"template_id" uuid NOT NULL,
	"month" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recurring_exclusions" ADD CONSTRAINT "recurring_exclusions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_exclusions" ADD CONSTRAINT "recurring_exclusions_template_id_transactions_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "recurring_exclusions_template_month_idx" ON "recurring_exclusions" USING btree ("template_id","month");