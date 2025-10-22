-- Update enforce_row_ownership to allow service role operations (used by backend functions)
-- while preserving strict ownership checks for authenticated users.
CREATE OR REPLACE FUNCTION public.enforce_row_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow backend (service role) to perform operations without requiring auth.uid()
  -- Supabase executes with the database role 'service_role' when using the service key
  IF current_user = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Enforce authentication for non-service role operations
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