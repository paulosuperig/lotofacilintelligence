DO $$
DECLARE demo_id uuid; admin_id uuid; total integer; denied boolean := false; original_claims text;
BEGIN
 original_claims := current_setting('request.jwt.claims', true);
 SELECT id INTO demo_id FROM public.profiles WHERE role = 'demo' AND status = 'active' LIMIT 1;
 SELECT id INTO admin_id FROM public.profiles WHERE role = 'admin' AND status = 'active' LIMIT 1;
 IF demo_id IS NULL OR admin_id IS NULL THEN RAISE EXCEPTION 'Regression fixtures require one active user and one active administrator'; END IF;
 PERFORM set_config('request.jwt.claims', json_build_object('sub',admin_id,'role','authenticated')::text,true);

 BEGIN
   UPDATE public.profiles SET status = 'blocked' WHERE id = demo_id;
   PERFORM set_config('request.jwt.claims', json_build_object('sub',demo_id,'role','authenticated')::text,true);
   SET LOCAL ROLE authenticated;
   IF app_private.is_active_account() THEN RAISE EXCEPTION 'AUD-001: blocked account passed activity check'; END IF;
   SELECT count(*) INTO total FROM public.games_history;
   IF total <> 0 THEN RAISE EXCEPTION 'AUD-001: blocked account read game history'; END IF;
   SELECT count(*) INTO total FROM public.ai_chat_history;
   IF total <> 0 THEN RAISE EXCEPTION 'AUD-001: blocked account read chat history'; END IF;
   BEGIN
     PERFORM public.clear_user_history();
   EXCEPTION WHEN insufficient_privilege THEN denied := true;
   END;
   IF NOT denied THEN RAISE EXCEPTION 'AUD-001: blocked account invoked privileged clear'; END IF;
   RESET ROLE;
   RAISE EXCEPTION USING ERRCODE='ZT001', MESSAGE='rollback successful blocked-account regression';
 EXCEPTION WHEN SQLSTATE 'ZT001' THEN NULL;
 END;
 RESET ROLE;
 PERFORM set_config('request.jwt.claims', json_build_object('sub',admin_id,'role','authenticated')::text,true);

 BEGIN
   DELETE FROM public.profiles WHERE id = demo_id;
   IF EXISTS (SELECT 1 FROM public.profiles WHERE id = demo_id) THEN RAISE EXCEPTION 'AUD-002: ordinary profile deletion was silently cancelled'; END IF;
   RAISE EXCEPTION USING ERRCODE='ZT001', MESSAGE='rollback successful ordinary deletion regression';
 EXCEPTION WHEN SQLSTATE 'ZT001' THEN NULL;
 END;

 SELECT count(*) INTO total FROM public.profiles WHERE role='admin' AND status='active';
 IF total = 1 THEN
   denied := false;
   BEGIN DELETE FROM public.profiles WHERE id = admin_id; EXCEPTION WHEN check_violation THEN denied := true; END;
   IF NOT denied THEN RAISE EXCEPTION 'AUD-002: last active administrator deletion allowed'; END IF;
   denied := false;
   BEGIN UPDATE public.profiles SET status='blocked' WHERE id = admin_id; EXCEPTION WHEN check_violation THEN denied := true; END;
   IF NOT denied THEN RAISE EXCEPTION 'AUD-002: last active administrator blocking allowed'; END IF;
   denied := false;
   BEGIN UPDATE public.profiles SET role='demo' WHERE id = admin_id; EXCEPTION WHEN check_violation THEN denied := true; END;
   IF NOT denied THEN RAISE EXCEPTION 'AUD-002: last active administrator demotion allowed'; END IF;
 ELSE
   RAISE EXCEPTION 'Regression fixture requires exactly one active administrator';
 END IF;
 PERFORM set_config('request.jwt.claims',COALESCE(original_claims,''),true);
END;
$$;