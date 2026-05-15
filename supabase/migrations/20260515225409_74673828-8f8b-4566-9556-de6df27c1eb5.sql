UPDATE public.profiles SET role='admin', status='active' WHERE id='c394b3d0-cedc-4773-934a-3ee4f8d888b6';
DELETE FROM public.user_roles WHERE user_id='c394b3d0-cedc-4773-934a-3ee4f8d888b6';
INSERT INTO public.user_roles (user_id, role) VALUES ('c394b3d0-cedc-4773-934a-3ee4f8d888b6', 'admin');