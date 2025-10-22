-- Update enforce_row_ownership to correctly bypass for backend (service role) by inspecting JWT role claim
CREATE OR REPLACE FUNCTION public.enforce_row_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req_role text := current_setting('request.jwt.claim.role', true);
BEGIN
  -- Allow backend (service role) to perform operations without requiring auth.uid()
  IF req_role = 'service_role' OR current_user = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Enforce authentication for non-service role operations
  IF auth.uid() IS NULL THEN 
    RAISE EXCEPTION 'Authentication required for % operation on %', TG_OP, TG_TABLE_NAME; 
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    IF NEW.user_id IS NULL THEN 
      NEW.user_id := auth.uid(); 
    END IF;
    IF NEW.user_id <> auth.uid() THEN 
      RAISE EXCEPTION 'Cannot insert row for different user (tried %, auth is %)', NEW.user_id, auth.uid(); 
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
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