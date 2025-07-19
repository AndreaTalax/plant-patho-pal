-- Create table to track user diagnosis usage
CREATE TABLE public.user_diagnosis_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  diagnoses_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_diagnosis_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for user diagnosis usage
CREATE POLICY "Users can view their own diagnosis usage" 
ON public.user_diagnosis_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own diagnosis usage" 
ON public.user_diagnosis_usage 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own diagnosis usage record" 
ON public.user_diagnosis_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create edge functions policy for diagnosis usage
CREATE POLICY "Edge functions can manage diagnosis usage" 
ON public.user_diagnosis_usage 
FOR ALL 
USING (true);