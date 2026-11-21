-- Applied in a transaction by install-queue.mjs. Only the migration owner can access rows.
CREATE SCHEMA IF NOT EXISTS zusik_model;
REVOKE ALL ON SCHEMA zusik_model FROM PUBLIC;
CREATE TABLE IF NOT EXISTS zusik_model.jobs (
  id uuid PRIMARY KEY, model text NOT NULL CHECK (model IN ('bielik','pllum')),
  prompt text, expires_at timestamptz NOT NULL, lease uuid, lease_until timestamptz,
  attempts smallint NOT NULL DEFAULT 0, done boolean NOT NULL DEFAULT false, output text
);
ALTER TABLE zusik_model.jobs ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION zusik_model.submit(j uuid, m text, p text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
BEGIN
  DELETE FROM zusik_model.jobs WHERE expires_at <= now();
  IF p IS NULL OR octet_length(p) NOT BETWEEN 1 AND 65536 THEN RAISE EXCEPTION 'bad prompt size'; END IF;
  INSERT INTO zusik_model.jobs(id,model,prompt,expires_at) VALUES (j,m,p,now()+interval '42 seconds');
  PERFORM pg_notify('zusik_model_ready','');
END $$;
CREATE OR REPLACE FUNCTION zusik_model.result(j uuid) RETURNS TABLE(started boolean, done boolean, output text)
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog AS $$
  SELECT attempts>0, done, output FROM zusik_model.jobs WHERE id=j AND expires_at>now()
$$;
CREATE OR REPLACE FUNCTION zusik_model.discard(j uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog AS $$ DELETE FROM zusik_model.jobs WHERE id=j $$;
CREATE OR REPLACE FUNCTION zusik_model.claim() RETURNS TABLE(id uuid, model text, prompt text, lease uuid, left_ms int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
BEGIN
  DELETE FROM zusik_model.jobs q WHERE q.expires_at<=now();
  RETURN QUERY WITH next AS (
    SELECT q.id FROM zusik_model.jobs q WHERE NOT q.done AND q.attempts<2 AND q.expires_at>now()
    AND (q.lease IS NULL OR q.lease_until<=now()) ORDER BY q.expires_at LIMIT 1 FOR UPDATE SKIP LOCKED
  ) UPDATE zusik_model.jobs q SET lease=gen_random_uuid(), lease_until=now()+interval '9 seconds', attempts=q.attempts+1
    FROM next WHERE q.id=next.id RETURNING q.id,q.model,q.prompt,q.lease,(extract(epoch FROM q.expires_at-now())*1000)::int;
END $$;
CREATE OR REPLACE FUNCTION zusik_model.renew(j uuid, token uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog AS $$
  WITH changed AS (UPDATE zusik_model.jobs SET lease_until=now()+interval '9 seconds'
    WHERE id=j AND lease=token AND lease_until>now() AND expires_at>now() RETURNING 1) SELECT EXISTS(SELECT FROM changed)
$$;
CREATE OR REPLACE FUNCTION zusik_model.finish(j uuid, token uuid, answer text) RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog AS $$
  WITH changed AS (UPDATE zusik_model.jobs SET
    done=(answer IS NOT NULL OR attempts>=2), output=answer,
    prompt=CASE WHEN answer IS NOT NULL OR attempts>=2 THEN NULL ELSE prompt END, lease=NULL, lease_until=NULL
    WHERE id=j AND lease=token AND lease_until>now() AND expires_at>now() AND (answer IS NULL OR octet_length(answer)<=32768)
    RETURNING 1) SELECT EXISTS(SELECT FROM changed)
$$;
REVOKE ALL ON ALL TABLES IN SCHEMA zusik_model FROM PUBLIC, zusik_model_worker, zusik_runtime;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA zusik_model FROM PUBLIC, zusik_model_worker, zusik_runtime;
GRANT USAGE ON SCHEMA zusik_model TO zusik_model_worker, zusik_runtime;
GRANT EXECUTE ON FUNCTION zusik_model.submit(uuid,text,text), zusik_model.result(uuid), zusik_model.discard(uuid) TO zusik_runtime;
GRANT EXECUTE ON FUNCTION zusik_model.claim(), zusik_model.renew(uuid,uuid), zusik_model.finish(uuid,uuid,text) TO zusik_model_worker;
