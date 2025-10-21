-- Normalize SECURITY DEFINER functions to set a fixed search_path

-- Recreate all SECURITY DEFINER functions with explicit 'SET search_path = public':
CREATE OR REPLACE FUNCTION public.purge_oauth_state()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM oauth_state WHERE expires_at < now();
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.oauth_state WHERE expires_at < now();
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_row_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Keep existing logic unchanged
  IF auth.uid() IS NULL THEN 
    RAISE EXCEPTION 'Authentication required for % operation on %', TG_OP, TG_TABLE_NAME; 
  END IF;
  
  IF TG_OP='INSERT' THEN
    IF NEW.user_id IS NULL THEN 
      NEW.user_id := auth.uid(); 
    END IF;
    IF NEW.user_id <> auth.uid() THEN 
      RAISE EXCEPTION 'Cannot insert row for different user (tried %, auth is %)', NEW.user_id, auth.uid(); 
    END IF;
  ELSIF TG_OP='UPDATE' THEN
    IF NEW.user_id IS NULL OR NEW.user_id <> OLD.user_id THEN 
      RAISE EXCEPTION 'Cannot change user_id on existing row'; 
    END IF;
    IF NEW.user_id <> auth.uid() THEN 
      RAISE EXCEPTION 'Cannot update row owned by different user'; 
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;