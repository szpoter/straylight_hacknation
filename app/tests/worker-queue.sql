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
RESET ROLE;
DO $$ DECLARE qid uuid := gen_random_uuid(); pid uuid := gen_random_uuid(); tid uuid := gen_random_uuid();
  first_claim record; retried record; old_model text;
BEGIN
  FOREACH old_model IN ARRAY ARRAY['bielik','pllum'] LOOP
    PERFORM zusik_model.submit(pid,old_model,'synthetic');
    IF (SELECT expires_at FROM zusik_model.jobs WHERE id=pid) IS DISTINCT FROM now()+interval '42 seconds' THEN
      RAISE EXCEPTION 'legacy TTL changed';
    END IF;
    PERFORM zusik_model.discard(pid);
  END LOOP;
  PERFORM zusik_model.submit_task(tid,'qwen-27b','{}','verify_claim');
  IF (SELECT expires_at FROM zusik_model.jobs WHERE id=tid) IS DISTINCT FROM now()+interval '9 seconds' THEN
    RAISE EXCEPTION 'typed Qwen TTL changed';
  END IF;
  PERFORM zusik_model.discard(tid);
  PERFORM zusik_model.submit(qid,'qwen-27b','synthetic long answer');
  SELECT * INTO first_claim FROM zusik_model.claim_task(ARRAY['qwen-27b']);
  IF first_claim.id IS DISTINCT FROM qid OR first_claim.left_ms <> 105000 THEN RAISE EXCEPTION 'short Qwen window'; END IF;
  -- Simulate the state after 45s and an abandoned heartbeat, without slowing down the test.
  UPDATE zusik_model.jobs SET expires_at=now()+interval '60 seconds', lease_until=now()-interval '1 second' WHERE id=qid;
  IF zusik_model.renew(qid,first_claim.lease) OR zusik_model.finish(qid,first_claim.lease,'late') THEN
    RAISE EXCEPTION 'stale owner could renew or finish';
  END IF;
  SELECT * INTO retried FROM zusik_model.claim_task(ARRAY['qwen-27b']);
  IF retried.id IS DISTINCT FROM qid OR retried.lease=first_claim.lease OR retried.left_ms<>60000 OR
    NOT zusik_model.renew(qid,retried.lease) THEN RAISE EXCEPTION 'abandoned job not recovered'; END IF;
  IF (SELECT lease_until FROM zusik_model.jobs WHERE id=qid) IS DISTINCT FROM now()+interval '9 seconds' THEN
    RAISE EXCEPTION 'renewal did not preserve short lease';
  END IF;
  IF NOT zusik_model.finish(qid,retried.lease,'synthetic late success') THEN RAISE EXCEPTION 'late valid result refused'; END IF;
  PERFORM zusik_model.discard(qid);
  PERFORM zusik_model.submit(qid,'qwen-27b','synthetic timeout');
  SELECT * INTO first_claim FROM zusik_model.claim_task(ARRAY['qwen-27b']);
  IF NOT zusik_model.finish(qid,first_claim.lease,'') THEN RAISE EXCEPTION 'timeout not finalized'; END IF;
  IF NOT EXISTS (SELECT FROM zusik_model.result(qid) WHERE done AND output='') OR
    EXISTS (SELECT FROM zusik_model.claim_task(ARRAY['qwen-27b'])) OR
    EXISTS (SELECT FROM zusik_model.jobs WHERE id=qid AND prompt IS NOT NULL) THEN
    RAISE EXCEPTION 'timeout retried or prompt retained';
  END IF;
  UPDATE zusik_model.jobs SET expires_at=now()-interval '1 second' WHERE id=qid;
  PERFORM zusik_model.submit(pid,'bielik','synthetic cleanup');
  IF EXISTS (SELECT FROM zusik_model.jobs WHERE id=qid) OR zusik_model.finish(qid,first_claim.lease,'late') THEN
    RAISE EXCEPTION 'expired job retained or resurrected';
  END IF;
END $$;
ROLLBACK;
