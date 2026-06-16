ALTER TABLE "agent_actions" ADD COLUMN "snapshot_data" jsonb;--> statement-breakpoint
ALTER TABLE "agent_actions" DROP COLUMN "inverse_operations";
