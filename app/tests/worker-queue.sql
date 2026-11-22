-- Run with psql -f tests/worker-queue.sql on an empty local qwen27_worker_contract database.
\set ON_ERROR_STOP on
BEGIN;
DO $$ BEGIN
  IF current_database() <> 'qwen27_worker_contract' OR inet_server_addr() IS NOT NULL THEN
    RAISE EXCEPTION 'dedicated local socket database required';
  END IF;
END $$;
CREATE SCHEMA zusik_model;
CREATE TABLE zusik_model.jobs (
  id uuid PRIMARY KEY, model text NOT NULL CHECK (model IN ('bielik','pllum')),
  prompt text, expires_at timestamptz NOT NULL, lease uuid, lease_until timestamptz,
  attempts smallint NOT NULL DEFAULT 0, done boolean NOT NULL DEFAULT false, output text
);
INSERT INTO zusik_model.jobs (id,model,prompt,expires_at) VALUES
  (gen_random_uuid(),'pllum','synthetic legacy answer',now()+interval '40 seconds');
DO $$ BEGIN
  BEGIN
    INSERT INTO zusik_model.jobs (id,model,prompt,expires_at) VALUES (gen_random_uuid(),'qwen-27b','synthetic',now());
    RAISE EXCEPTION 'old queue accepted qwen';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;
\ir ../workers/queue.sql
\ir ../workers/queue.sql
SET LOCAL ROLE zusik_model_worker;
DO $$ BEGIN
  IF EXISTS (SELECT FROM zusik_model.claim_task(ARRAY['qwen-27b'])) THEN
    RAISE EXCEPTION 'preview worker took legacy job';
  END IF;
END $$;
SET LOCAL ROLE zusik_runtime;
SELECT zusik_model.submit(gen_random_uuid(),'qwen-27b','synthetic answer');
SELECT zusik_model.submit_task(gen_random_uuid(),'bielik','{}','plan_public');
DO $$ BEGIN
  IF has_function_privilege(current_user,'zusik_model.claim_task(text[])','EXECUTE') THEN
    RAISE EXCEPTION 'runtime can claim jobs';
  END IF;
  BEGIN
    PERFORM zusik_model.submit(gen_random_uuid(),'unknown','synthetic');
    RAISE EXCEPTION 'queue accepted unknown model';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;
SET LOCAL ROLE zusik_model_worker;
DO $$ DECLARE claimed record; BEGIN
  IF has_function_privilege(current_user,'zusik_model.submit(uuid,text,text)','EXECUTE')
    OR has_table_privilege(current_user,'zusik_model.jobs','SELECT,UPDATE') THEN
    RAISE EXCEPTION 'unexpected worker privileges';
  END IF;
  SELECT * INTO claimed FROM zusik_model.claim();
  IF claimed.model IS DISTINCT FROM 'pllum' THEN RAISE EXCEPTION 'legacy answer lost'; END IF;
  SELECT * INTO claimed FROM zusik_model.claim_task();
  IF claimed.model IS DISTINCT FROM 'bielik' THEN RAISE EXCEPTION 'legacy typed job lost'; END IF;
  IF EXISTS (SELECT FROM zusik_model.claim()) OR EXISTS (SELECT FROM zusik_model.claim_task())
    OR EXISTS (SELECT FROM zusik_model.claim_task(ARRAY['bielik','pllum'])) THEN
    RAISE EXCEPTION 'two-model worker took qwen';
  END IF;
  SELECT * INTO claimed FROM zusik_model.claim_task(ARRAY['qwen-27b']);
  IF claimed.model IS DISTINCT FROM 'qwen-27b' OR NOT zusik_model.finish(claimed.id,claimed.lease,'{}') THEN
    RAISE EXCEPTION 'qwen job not completed';
  END IF;
END $$;
ROLLBACK;
