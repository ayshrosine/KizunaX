-- KizunaX Supabase Schema Migration
-- Run this in your Supabase SQL Editor to create all necessary tables.

-- 1. Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_filename TEXT,
    file_type TEXT NOT NULL,
    file_size_bytes BIGINT,
    storage_key TEXT,
    storage_url TEXT,
    status TEXT NOT NULL DEFAULT 'uploaded',
    failure_reason TEXT,
    category TEXT,
    category_confidence FLOAT,
    category_overridden BOOLEAN DEFAULT false,
    extracted_text TEXT,
    ocr_applied BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);

-- 2. Skills Table
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    source_document_ids UUID[] DEFAULT '{}',
    confidence_score FLOAT,
    on_resume BOOLEAN DEFAULT false,
    first_detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON public.skills(user_id);

-- 3. Relationships Table
CREATE TABLE IF NOT EXISTS public.relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    from_entity UUID NOT NULL,
    to_entity UUID NOT NULL,
    relation_type TEXT NOT NULL,
    ai_generated BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_relationships_user_id ON public.relationships(user_id);

-- 4. Timeline Events Table
CREATE TABLE IF NOT EXISTS public.timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month INT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_timeline_user_id ON public.timeline_events(user_id);

-- 5. Portfolio Settings Table
CREATE TABLE IF NOT EXISTS public.portfolio_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    theme TEXT DEFAULT 'slate',
    visible_categories TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Integrations Table
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'connected',
    workspace_name TEXT,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- RLS (Row Level Security) Policies
-- (Optional: since backend uses SERVICE_ROLE key, RLS can be bypassed, 
-- but it's good practice to enable them if frontend queries directly later)

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own documents" ON public.documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access their own skills" ON public.skills FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access their own relationships" ON public.relationships FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access their own timeline" ON public.timeline_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access their own portfolio" ON public.portfolio_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access their own integrations" ON public.integrations FOR ALL USING (auth.uid() = user_id);
