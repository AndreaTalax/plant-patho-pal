-- Fix all database functions to have secure search_path
CREATE OR REPLACE FUNCTION public.log_user_sessions_cdc_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.cdc_events (
    table_name,
    operation,
    old_data,
    new_data,
    user_id,
    metadata
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
    CASE 
      WHEN TG_OP != 'DELETE' THEN NEW.user_id
      WHEN TG_OP = 'DELETE' THEN OLD.user_id
      ELSE NULL
    END,
    jsonb_build_object(
      'timestamp', now(),
      'source', 'database_trigger'
    )
  );
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix other functions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_email_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    expert_email text := 'agrotecnicomarconigro@gmail.com';
    message_content text;
BEGIN
    message_content := NEW.content;
    PERFORM pg_notify('email_notification', format('New message: %s', message_content));
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations 
  SET 
    last_message_text = NEW.content,
    last_message_at = NEW.sent_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS TABLE(role app_role)
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ur.role
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.send_message(p_conversation_id bigint, p_sender_id uuid, p_text text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.messages (conversation_id, sender_id, text)
    VALUES (p_conversation_id, p_sender_id, p_text);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_online_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles 
    SET is_online = true, last_seen_at = now()
    WHERE id = NEW.user_id;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_sessions 
      WHERE user_id = NEW.user_id AND is_active = true AND id != NEW.id
    ) THEN
      UPDATE public.profiles 
      SET is_online = false, last_seen_at = now()
      WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    UPDATE public.profiles 
    SET last_seen_at = now()
    WHERE id = NEW.user_id;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.user_sessions 
  SET is_active = false
  WHERE is_active = true 
    AND last_activity_at < (now() - interval '5 minutes');
  
  DELETE FROM public.user_sessions 
  WHERE is_active = false 
    AND last_activity_at < (now() - interval '24 hours');
END;
$$;

CREATE OR REPLACE FUNCTION public.log_messages_cdc_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.cdc_events (
    table_name,
    operation,
    old_data,
    new_data,
    user_id,
    metadata
  ) VALUES (
    'messages',
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
    CASE 
      WHEN TG_OP != 'DELETE' AND NEW.sender_id IS NOT NULL THEN NEW.sender_id
      WHEN TG_OP = 'DELETE' AND OLD.sender_id IS NOT NULL THEN OLD.sender_id
      ELSE NULL
    END,
    jsonb_build_object(
      'timestamp', now(),
      'source', 'database_trigger',
      'conversation_id', CASE 
        WHEN TG_OP != 'DELETE' THEN NEW.conversation_id
        WHEN TG_OP = 'DELETE' THEN OLD.conversation_id
        ELSE NULL
      END,
      'recipient_id', CASE 
        WHEN TG_OP != 'DELETE' THEN NEW.recipient_id
        WHEN TG_OP = 'DELETE' THEN OLD.recipient_id
        ELSE NULL
      END
    )
  );
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;