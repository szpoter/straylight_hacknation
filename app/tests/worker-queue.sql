-- Run with psql -f tests/worker-queue.sql on an empty local qwen27_worker_contract database.
\set ON_ERROR_STOP on
BEGIN;
DO $$ BEGIN
  IF current_database() <> 'qwen27_worker_contract' OR inet_server_addr() IS NOT NULL THEN
    RAISE EXCEPTION 'dedicated local socket database required';
  END IF;
END $$;
-- Simulate an installation which can still contain unexpired previous-generation jobs.
CREATE SCHEMA zusik_model;
CREATE TABLE zusik_model.jobs (
  id uuid PRIMARY KEY, model text NOT NULL CHECK (model IN ('bielik','pllum','qwen-27b')),
  prompt text, expires_at timestamptz NOT NULL, lease uuid, lease_until timestamptz,
  attempts smallint NOT NULL DEFAULT 0, done boolean NOT NULL DEFAULT false, output text
);
INSERT INTO zusik_model.jobs(id,model,prompt,expires_at) VALUES
  (gen_random_uuid(),'qwen-27b','synthetic historical job',now()+interval '60 seconds'),
  (gen_random_uuid(),'pllum','synthetic existing PLLuM job',now()+interval '42 seconds');
\ir ../workers/queue.sql
SET LOCAL ROLE zusik_runtime;
DO $$ BEGIN
  BEGIN
    PERFORM zusik_model.submit(gen_random_uuid(),'qwen-27b','synthetic');
    RAISE EXCEPTION 'retired model submitted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    PERFORM zusik_model.submit_task(gen_random_uuid(),'qwen-27b','{}','verify_claim');
    RAISE EXCEPTION 'retired model submitted typed task';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  IF has_function_privilege(current_user,'zusik_model.claim_task(text[])','EXECUTE') THEN
    RAISE EXCEPTION 'runtime can claim jobs';
  END IF;
  PERFORM zusik_model.submit_task(gen_random_uuid(),'bielik','{}','plan_public');
END $$;
SET LOCAL ROLE zusik_model_worker;
DO $$ DECLARE claimed record; BEGIN
  IF has_function_privilege(current_user,'zusik_model.submit(uuid,text,text)','EXECUTE')
    OR has_table_privilege(current_user,'zusik_model.jobs','SELECT,UPDATE') THEN
    RAISE EXCEPTION 'unexpected worker privileges';
  END IF;
  SELECT * INTO claimed FROM zusik_model.claim();
  IF claimed.model IS DISTINCT FROM 'pllum' OR NOT zusik_model.finish(claimed.id,claimed.lease,'{}') THEN
    RAISE EXCEPTION 'existing PLLuM job did not finish';
  END IF;
  SELECT * INTO claimed FROM zusik_model.claim_task();
  IF claimed.model IS DISTINCT FROM 'bielik' OR NOT zusik_model.finish(claimed.id,claimed.lease,'{}') THEN
    RAISE EXCEPTION 'typed Bielik job did not finish';
  END IF;
  IF EXISTS (SELECT FROM zusik_model.claim_task(ARRAY['qwen-27b'])) THEN
    RAISE EXCEPTION 'worker took retired job';
  END IF;
END $$;
RESET ROLE;
DO $$ BEGIN
  IF (SELECT count(*) FROM zusik_model.jobs WHERE model='qwen-27b') <> 1 THEN
    RAISE EXCEPTION 'migration modified a historical record';
  END IF;
END $$;
ROLLBACK;
