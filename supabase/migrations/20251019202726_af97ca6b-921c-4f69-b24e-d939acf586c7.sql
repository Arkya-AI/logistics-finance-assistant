-- Fix search_path for enforce_row_ownership trigger function
CREATE OR REPLACE FUNCTION enforce_row_ownership()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NULL THEN 
    RAISE EXCEPTION 'Authentication required for % operation on %', TG_OP, TG_TABLE_NAME; 
  END IF;
  
  IF TG_OP='INSERT' THEN
    -- Auto-set user_id if null, but reject if it doesn't match auth user
    IF NEW.user_id IS NULL THEN 
      NEW.user_id := auth.uid(); 
    END IF;
    IF NEW.user_id <> auth.uid() THEN 
      RAISE EXCEPTION 'Cannot insert row for different user (tried %, auth is %)', NEW.user_id, auth.uid(); 
    END IF;
  ELSIF TG_OP='UPDATE' THEN
    -- Prevent changing user_id
    IF NEW.user_id IS NULL OR NEW.user_id <> OLD.user_id THEN 
      RAISE EXCEPTION 'Cannot change user_id on existing row'; 
    END IF;
    IF NEW.user_id <> auth.uid() THEN 
      RAISE EXCEPTION 'Cannot update row owned by different user'; 
    END IF;
  END IF;
  
  RETURN NEW;
END $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';