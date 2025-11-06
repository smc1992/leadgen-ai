-- Emex Dashboard - Supabase Database Schema
-- Run this in your Supabase SQL Editor to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Leads Table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    job_title TEXT,
    company TEXT,
    email TEXT,
    email_status TEXT CHECK (email_status IN ('valid', 'invalid', 'unknown')) DEFAULT 'unknown',
    score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    region TEXT,
    channel TEXT NOT NULL,
    source_url TEXT,
    is_outreach_ready BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrichment fields for B2B leads (optional, null by default)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS rating_avg NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS rating_count INTEGER;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS categories TEXT[];

CREATE INDEX IF NOT EXISTS idx_leads_website_url ON leads(website_url);
CREATE INDEX IF NOT EXISTS idx_leads_city_company ON leads(city, company);

-- Emails Table
CREATE TABLE IF NOT EXISTS emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    campaign_id TEXT NOT NULL,
    status TEXT CHECK (status IN ('sent', 'opened', 'clicked', 'bounced', 'replied')) DEFAULT 'sent',
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    template TEXT NOT NULL,
    domain TEXT NOT NULL,
    followups INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scrape Runs Table
CREATE TABLE IF NOT EXISTS scrape_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT CHECK (type IN ('linkedin', 'maps', 'validator')) NOT NULL,
    status TEXT NOT NULL,
    result_count INTEGER DEFAULT 0,
    triggered_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Items Table
CREATE TABLE IF NOT EXISTS content_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT CHECK (type IN ('text', 'video', 'carousel')) NOT NULL,
    status TEXT CHECK (status IN ('draft', 'scheduled', 'published')) DEFAULT 'draft',
    platform TEXT[] NOT NULL,
    schedule_at TIMESTAMPTZ,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score);
CREATE INDEX IF NOT EXISTS idx_leads_region ON leads(region);
CREATE INDEX IF NOT EXISTS idx_leads_is_outreach_ready ON leads(is_outreach_ready);
CREATE INDEX IF NOT EXISTS idx_emails_lead_id ON emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_schedule_at ON content_items(schedule_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

-- Example policies (adjust based on your auth setup)
-- Allow authenticated users to read all leads
CREATE POLICY "Allow authenticated users to read leads"
    ON leads FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert leads
CREATE POLICY "Allow authenticated users to insert leads"
    ON leads FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update leads
CREATE POLICY "Allow authenticated users to update leads"
    ON leads FOR UPDATE
    TO authenticated
    USING (true);

-- Similar policies for other tables
CREATE POLICY "Allow authenticated users full access to emails"
    ON emails FOR ALL
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users full access to campaigns"
    ON campaigns FOR ALL
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users full access to scrape_runs"
    ON scrape_runs FOR ALL
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users full access to content_items"
    ON content_items FOR ALL
    TO authenticated
    USING (true);

-- Materialized view for weekly leads by region
CREATE MATERIALIZED VIEW IF NOT EXISTS weekly_leads_by_region AS
SELECT 
    DATE_TRUNC('week', created_at) as week,
    region,
    COUNT(*) as lead_count,
    AVG(score) as avg_score
FROM leads
GROUP BY DATE_TRUNC('week', created_at), region
ORDER BY week DESC, region;

-- Refresh materialized view function
CREATE OR REPLACE FUNCTION refresh_weekly_leads_by_region()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW weekly_leads_by_region;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE leads IS 'Stores all lead information from various sources';
COMMENT ON TABLE emails IS 'Tracks email outreach status for each lead';
COMMENT ON TABLE campaigns IS 'Email campaign configurations';
COMMENT ON TABLE scrape_runs IS 'Logs of scraping operations from Apify';
COMMENT ON TABLE content_items IS 'Social media content items and scheduling';

-- Outreach Module Tables
-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'Introduction',
    variables TEXT[] DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Sequences Table
CREATE TABLE IF NOT EXISTS email_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft',
    steps JSONB DEFAULT '[]',
    enrolled_leads INTEGER DEFAULT 0,
    completion_rate DECIMAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Campaigns Table (Updated for outreach)
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    template_id UUID REFERENCES email_templates(id),
    status TEXT DEFAULT 'draft',
    leads_count INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge Base Table
CREATE TABLE IF NOT EXISTS knowledge_bases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'documents',
    status TEXT DEFAULT 'processing',
    document_count INTEGER DEFAULT 0,
    size_bytes INTEGER DEFAULT 0,
    file_urls TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for outreach tables
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_sequences_user_id ON email_sequences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_id ON email_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_bases_user_id ON knowledge_bases(user_id);

-- Enable RLS on outreach tables
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;

-- Lead Lists for targeting outreach
CREATE TABLE IF NOT EXISTS lead_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_list_items (
    list_id UUID REFERENCES lead_lists(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (list_id, lead_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_lists_user_id ON lead_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_list_items_list_id ON lead_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_lead_list_items_lead_id ON lead_list_items(lead_id);

ALTER TABLE lead_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_list_items ENABLE ROW LEVEL SECURITY;

-- RLS: Only owner can access their lead lists
DROP POLICY IF EXISTS "lead_lists_select_own" ON lead_lists;
CREATE POLICY "lead_lists_select_own"
    ON lead_lists FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "lead_lists_insert_own" ON lead_lists;
CREATE POLICY "lead_lists_insert_own"
    ON lead_lists FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "lead_lists_update_own" ON lead_lists;
CREATE POLICY "lead_lists_update_own"
    ON lead_lists FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "lead_lists_delete_own" ON lead_lists;
CREATE POLICY "lead_lists_delete_own"
    ON lead_lists FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- RLS: Lead list items bound to list ownership
DROP POLICY IF EXISTS "lead_list_items_select_own" ON lead_list_items;
CREATE POLICY "lead_list_items_select_own"
    ON lead_list_items FOR SELECT
    TO authenticated
    USING (EXISTS (SELECT 1 FROM lead_lists ll WHERE ll.id = lead_list_items.list_id AND ll.user_id = auth.uid()));

DROP POLICY IF EXISTS "lead_list_items_insert_own" ON lead_list_items;
CREATE POLICY "lead_list_items_insert_own"
    ON lead_list_items FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM lead_lists ll WHERE ll.id = lead_list_items.list_id AND ll.user_id = auth.uid()));

DROP POLICY IF EXISTS "lead_list_items_delete_own" ON lead_list_items;
CREATE POLICY "lead_list_items_delete_own"
    ON lead_list_items FOR DELETE
    TO authenticated
    USING (EXISTS (SELECT 1 FROM lead_lists ll WHERE ll.id = lead_list_items.list_id AND ll.user_id = auth.uid()));

-- AI Conversations Table
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    ai_response TEXT,
    context TEXT DEFAULT 'general',
    lead_data JSONB,
    campaign_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Usage Logs Table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ai_type TEXT NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Insights Table (for storing generated insights)
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL, -- 'lead_score', 'campaign_optimization', 'trend_analysis'
    title TEXT NOT NULL,
    content JSONB NOT NULL,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    is_implemented BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Enable RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- AI Conversations Policies
CREATE POLICY "Users can view own AI conversations" ON ai_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI conversations" ON ai_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI conversations" ON ai_conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI conversations" ON ai_conversations
    FOR DELETE USING (auth.uid() = user_id);

-- AI Usage Logs Policies
CREATE POLICY "Users can view own AI usage logs" ON ai_usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI usage logs" ON ai_usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI Insights Policies
CREATE POLICY "Users can view own AI insights" ON ai_insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI insights" ON ai_insights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI insights" ON ai_insights
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI insights" ON ai_insights
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id_created_at ON ai_conversations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_context ON ai_conversations(context);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id_created_at ON ai_usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_ai_type ON ai_usage_logs(ai_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id_type ON ai_insights(user_id, insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_expires_at ON ai_insights(expires_at);

-- Function to clean up expired insights
CREATE OR REPLACE FUNCTION cleanup_expired_insights()
RETURNS void AS $$
BEGIN
    DELETE FROM ai_insights WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically clean up expired insights
CREATE OR REPLACE TRIGGER trigger_cleanup_expired_insights
    AFTER INSERT ON ai_insights
    EXECUTE FUNCTION cleanup_expired_insights();

-- Updated triggers for AI tables
CREATE OR REPLACE TRIGGER trigger_ai_conversations_updated_at
    BEFORE UPDATE ON ai_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trigger_ai_usage_logs_updated_at
    BEFORE UPDATE ON ai_usage_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for outreach tables
CREATE POLICY "Users can manage their own email_templates"
    ON email_templates FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own email_sequences"
    ON email_sequences FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own email_campaigns"
    ON email_campaigns FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own knowledge_bases"
    ON knowledge_bases FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_sequences_updated_at
    BEFORE UPDATE ON email_sequences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at
    BEFORE UPDATE ON email_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_bases_updated_at
    BEFORE UPDATE ON knowledge_bases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for outreach tables
COMMENT ON TABLE email_templates IS 'Email templates for outreach campaigns';
COMMENT ON TABLE email_sequences IS 'Automated email sequences with multiple steps';
COMMENT ON TABLE email_campaigns IS 'Email marketing campaigns with performance tracking';
COMMENT ON TABLE knowledge_bases IS 'Document collections for AI-powered personalization';

-- Storage Buckets Setup
-- Create knowledge base storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'knowledge-bases', 
  'knowledge-bases', 
  false, 
  52428800, -- 50MB
  ARRAY[
    'application/pdf',
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Create media storage bucket for images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media', 
  true,
  10485760, -- 10MB
  ARRAY[
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Users can access their own knowledge base files
CREATE POLICY "Users can access their own knowledge base files"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'knowledge-bases' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can upload to their own knowledge base folder
CREATE POLICY "Users can upload to their own knowledge base folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'knowledge-bases' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Public access to media bucket
CREATE POLICY "Public media access"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'media');

-- Authenticated users can upload to media
CREATE POLICY "Authenticated users can upload media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Users can manage their own media files
CREATE POLICY "Users can manage their own media files"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- AI Prompts Table
CREATE TABLE IF NOT EXISTS ai_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  variables JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for ai_prompts
CREATE INDEX IF NOT EXISTS idx_ai_prompts_user_id ON ai_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_category ON ai_prompts(category);

-- RLS Policies for ai_prompts
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prompts"
  ON ai_prompts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create their own prompts"
  ON ai_prompts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own prompts"
  ON ai_prompts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own prompts"
  ON ai_prompts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text);

-- Update trigger for ai_prompts
CREATE TRIGGER update_ai_prompts_updated_at
  BEFORE UPDATE ON ai_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- OUTREACH_EMAILS TABLE für Email-Versand Tracking
CREATE TABLE IF NOT EXISTS outreach_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
    lead_id UUID,
    lead_email TEXT NOT NULL,
    lead_name TEXT,
    template_id UUID REFERENCES email_templates(id),
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT CHECK (status IN ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed')) DEFAULT 'queued',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    bounce_reason TEXT,
    resend_api_id TEXT, -- Resend Message ID
    open_pixel_url TEXT,
    click_tracking_urls JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_outreach_emails_user_id ON outreach_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_outreach_emails_campaign_id ON outreach_emails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_outreach_emails_status ON outreach_emails(status);
CREATE INDEX IF NOT EXISTS idx_outreach_emails_sent_at ON outreach_emails(sent_at);
CREATE INDEX IF NOT EXISTS idx_outreach_emails_lead_email ON outreach_emails(lead_email);

-- RLS Policies
ALTER TABLE outreach_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own outreach emails"
    ON outreach_emails FOR ALL
    TO authenticated
    USING (user_id = auth.uid());

-- Update Trigger
CREATE TRIGGER update_outreach_emails_updated_at
    BEFORE UPDATE ON outreach_emails
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE outreach_emails IS 'Tracks individual email sends for outreach campaigns';

-- SALES PIPELINE TABLES
-- Deal Stages Table
CREATE TABLE IF NOT EXISTS deal_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    order_position INTEGER NOT NULL,
    probability DECIMAL(5,2) DEFAULT 0, -- Win probability percentage
    is_default BOOLEAN DEFAULT FALSE,
    is_won BOOLEAN DEFAULT FALSE,
    is_lost BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deals Table
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    deal_value DECIMAL(15,2),
    currency TEXT DEFAULT 'EUR',
    stage_id UUID REFERENCES deal_stages(id),
    lead_id UUID REFERENCES leads(id),
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    company_name TEXT,
    company_website TEXT,
    company_size TEXT,
    industry TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    expected_close_date DATE,
    actual_close_date DATE,
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    notes TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('active', 'won', 'lost', 'on_hold')) DEFAULT 'active',
    source TEXT DEFAULT 'outreach', -- 'outreach', 'inbound', 'referral', 'cold', etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deal Activities Table (for tracking all deal-related activities)
CREATE TABLE IF NOT EXISTS deal_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    activity_type TEXT NOT NULL, -- 'created', 'stage_changed', 'note_added', 'email_sent', 'call_made', etc.
    description TEXT,
    metadata JSONB DEFAULT '{}', -- Additional data like old_stage, new_stage, email_id, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deal Comments Table
CREATE TABLE IF NOT EXISTS deal_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- Internal notes vs. client-visible comments
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead Scoring Rules Table
CREATE TABLE IF NOT EXISTS lead_scoring_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL, -- e.g., {"company_size": {"min": 50}, "industry": ["tech", "finance"]}
    score INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead Scores Table
CREATE TABLE IF NOT EXISTS lead_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    total_score INTEGER DEFAULT 0,
    score_breakdown JSONB DEFAULT '{}', -- Breakdown by different scoring factors
    qualification_level TEXT CHECK (qualification_level IN ('cold', 'warm', 'hot', 'qualified')) DEFAULT 'cold',
    last_scored_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Members Table (for team collaboration)
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'manager', 'sales_rep', 'viewer')) DEFAULT 'sales_rep',
    department TEXT,
    territories TEXT[] DEFAULT '{}', -- Geographic territories
    industries TEXT[] DEFAULT '{}', -- Industry specializations
    quota_monthly DECIMAL(15,2) DEFAULT 0,
    quota_quarterly DECIMAL(15,2) DEFAULT 0,
    quota_yearly DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forecasting Table
CREATE TABLE IF NOT EXISTS sales_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    period TEXT NOT NULL, -- 'monthly', 'quarterly', 'yearly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    forecast_amount DECIMAL(15,2) NOT NULL,
    actual_amount DECIMAL(15,2) DEFAULT 0,
    confidence_percentage DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_deals_stage_id ON deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_expected_close_date ON deals(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_deal_activities_deal_id ON deal_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_comments_deal_id ON deal_comments(deal_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_lead_id ON lead_scores(lead_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_forecasts_user_id ON sales_forecasts(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_forecasts_period ON sales_forecasts(period, period_start);

-- RLS Policies for Sales Pipeline
ALTER TABLE deal_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_forecasts ENABLE ROW LEVEL SECURITY;

-- Deal Stages Policies (everyone can read, only admins can modify)
CREATE POLICY "Everyone can read deal stages" ON deal_stages FOR SELECT USING (true);
CREATE POLICY "Admins can manage deal stages" ON deal_stages FOR ALL USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'manager')
    )
);

-- Deals Policies
CREATE POLICY "Users can view deals assigned to them or their team" ON deals FOR SELECT USING (
    assigned_to = auth.uid() OR
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'manager')
    )
);

CREATE POLICY "Users can create deals" ON deals FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update deals they created or are assigned to" ON deals FOR UPDATE USING (
    created_by = auth.uid() OR assigned_to = auth.uid() OR
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'manager')
    )
);

-- Deal Activities Policies
CREATE POLICY "Users can view activities for deals they can access" ON deal_activities FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM deals d
        WHERE d.id = deal_activities.deal_id AND (
            d.assigned_to = auth.uid() OR d.created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM team_members tm
                WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'manager')
            )
        )
    )
);

CREATE POLICY "Users can create activities for deals they can access" ON deal_activities FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM deals d
        WHERE d.id = deal_activities.deal_id AND (
            d.assigned_to = auth.uid() OR d.created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM team_members tm
                WHERE tm.user_id = auth.uid() AND tm.role IN ('admin', 'manager')
            )
        )
    )
);

-- Similar policies for other tables...
CREATE POLICY "Users can manage their own team membership" ON team_members FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all team members" ON team_members FOR ALL USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.user_id = auth.uid() AND tm.role = 'admin'
    )
);

-- Triggers
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deal_stages_updated_at BEFORE UPDATE ON deal_stages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deal_comments_updated_at BEFORE UPDATE ON deal_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lead_scores_updated_at BEFORE UPDATE ON lead_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_forecasts_updated_at BEFORE UPDATE ON sales_forecasts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Default Deal Stages
INSERT INTO deal_stages (name, description, color, order_position, probability) VALUES
    ('Discovery', 'Initial contact and qualification', '#3b82f6', 1, 10),
    ('Needs Analysis', 'Understanding customer requirements', '#8b5cf6', 2, 20),
    ('Proposal', 'Sending proposal and pricing', '#f59e0b', 3, 40),
    ('Negotiation', 'Final discussions and terms', '#ef4444', 4, 70),
    ('Closed Won', 'Deal successfully closed', '#10b981', 5, 100),
    ('Closed Lost', 'Deal lost to competitor or cancelled', '#6b7280', 6, 0)
ON CONFLICT (id) DO NOTHING;

-- Default Sales Forecasts (will be created via API for each user)
-- Note: Forecasts are created per user via /api/setup/forecasts to avoid conflicts

-- WORKFLOW AUTOMATION TABLES
-- Workflows Table
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL, -- 'lead_created', 'deal_stage_changed', 'email_opened', 'time_based', 'webhook'
    trigger_config JSONB DEFAULT '{}', -- Configuration for the trigger
    is_active BOOLEAN DEFAULT TRUE,
    is_template BOOLEAN DEFAULT FALSE,
    category TEXT DEFAULT 'automation', -- 'automation', 'nurturing', 'follow_up', 'scoring'
    execution_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Steps Table
CREATE TABLE IF NOT EXISTS workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    step_type TEXT NOT NULL, -- 'send_email', 'update_deal', 'create_task', 'wait', 'condition', 'webhook', 'notification'
    step_config JSONB DEFAULT '{}', -- Configuration for the step
    conditions JSONB DEFAULT '{}', -- Conditions for conditional steps
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Executions Table (for tracking workflow runs)
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    trigger_entity_id UUID, -- ID of the entity that triggered the workflow (lead_id, deal_id, etc.)
    trigger_entity_type TEXT, -- 'lead', 'deal', 'contact', 'campaign'
    status TEXT CHECK (status IN ('running', 'completed', 'failed', 'cancelled')) DEFAULT 'running',
    current_step INTEGER DEFAULT 0,
    execution_data JSONB DEFAULT '{}', -- Runtime data for the execution
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zapier Integration Table
CREATE TABLE IF NOT EXISTS zapier_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    zap_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    trigger_url TEXT NOT NULL, -- Zapier webhook URL
    event_types TEXT[] DEFAULT '{}', -- Events this zap listens to
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Advanced Lead Scoring Model Table
CREATE TABLE IF NOT EXISTS lead_scoring_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    model_type TEXT CHECK (model_type IN ('regression', 'classification', 'neural_network')) DEFAULT 'regression',
    features JSONB DEFAULT '{}', -- Features used in the model
    weights JSONB DEFAULT '{}', -- Model weights/parameters
    accuracy_score DECIMAL(5,4) DEFAULT 0,
    is_active BOOLEAN DEFAULT FALSE,
    training_data_size INTEGER DEFAULT 0,
    last_trained_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intent Data Integration Table
CREATE TABLE IF NOT EXISTS intent_data_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_name TEXT CHECK (provider_name IN ('bombora', 'zoominfo', 'gartner', 'discoverorg')) NOT NULL,
    api_key TEXT, -- Encrypted API key
    api_endpoint TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    last_sync_at TIMESTAMPTZ,
    sync_frequency_hours INTEGER DEFAULT 24,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intent Signals Table
CREATE TABLE IF NOT EXISTS intent_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES intent_data_providers(id) ON DELETE CASCADE,
    signal_type TEXT NOT NULL, -- 'content_view', 'search_query', 'job_posting', 'funding_news', etc.
    signal_data JSONB DEFAULT '{}',
    signal_strength DECIMAL(3,2) DEFAULT 0, -- 0.0 to 1.0
    detected_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- A/B Testing Campaigns Table
CREATE TABLE IF NOT EXISTS ab_test_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    campaign_type TEXT CHECK (campaign_type IN ('email_subject', 'email_content', 'send_time', 'template')) NOT NULL,
    original_template_id UUID REFERENCES email_templates(id),
    test_variants JSONB DEFAULT '[]', -- Array of test variants
    winner_variant_id TEXT, -- ID of the winning variant
    status TEXT CHECK (status IN ('draft', 'running', 'completed', 'cancelled')) DEFAULT 'draft',
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    sample_size INTEGER DEFAULT 1000,
    confidence_level DECIMAL(5,4) DEFAULT 0.95,
    test_metric TEXT CHECK (test_metric IN ('open_rate', 'click_rate', 'reply_rate', 'conversion_rate')) DEFAULT 'open_rate',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- A/B Test Results Table
CREATE TABLE IF NOT EXISTS ab_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID REFERENCES ab_test_campaigns(id) ON DELETE CASCADE,
    variant_id TEXT NOT NULL,
    variant_name TEXT NOT NULL,
    sample_size INTEGER NOT NULL,
    opens INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    replies INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    open_rate DECIMAL(5,4) DEFAULT 0,
    click_rate DECIMAL(5,4) DEFAULT 0,
    reply_rate DECIMAL(5,4) DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0,
    confidence_interval DECIMAL(5,4),
    is_winner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for workflow automation
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger_type ON workflows(trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_zapier_integrations_user_id ON zapier_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_scoring_models_user_id ON lead_scoring_models(user_id);
CREATE INDEX IF NOT EXISTS idx_intent_data_providers_user_id ON intent_data_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_intent_signals_lead_id ON intent_signals(lead_id);
CREATE INDEX IF NOT EXISTS idx_intent_signals_provider_id ON intent_signals(provider_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_campaigns_user_id ON ab_test_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_test_id ON ab_test_results(test_id);

-- RLS Policies for workflow automation
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapier_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scoring_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE intent_data_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE intent_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;

-- Policies for workflows
CREATE POLICY "Users can manage their own workflows" ON workflows FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view workflow executions for their workflows" ON workflow_executions FOR SELECT USING (
    EXISTS (SELECT 1 FROM workflows w WHERE w.id = workflow_executions.workflow_id AND w.user_id = auth.uid())
);
CREATE POLICY "Users can manage their Zapier integrations" ON zapier_integrations FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their lead scoring models" ON lead_scoring_models FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their intent data providers" ON intent_data_providers FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view intent signals for their leads" ON intent_signals FOR SELECT USING (
    EXISTS (SELECT 1 FROM leads l WHERE l.id = intent_signals.lead_id AND l.user_id = auth.uid()::text)
);
CREATE POLICY "Users can manage their A/B test campaigns" ON ab_test_campaigns FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view A/B test results for their tests" ON ab_test_results FOR SELECT USING (
    EXISTS (SELECT 1 FROM ab_test_campaigns c WHERE c.id = ab_test_results.test_id AND c.user_id = auth.uid())
);

-- Triggers for workflow automation
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_steps_updated_at BEFORE UPDATE ON workflow_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_zapier_integrations_updated_at BEFORE UPDATE ON zapier_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lead_scoring_models_updated_at BEFORE UPDATE ON lead_scoring_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_intent_data_providers_updated_at BEFORE UPDATE ON intent_data_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ab_test_campaigns_updated_at BEFORE UPDATE ON ab_test_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ab_test_results_updated_at BEFORE UPDATE ON ab_test_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Default workflow templates
INSERT INTO workflows (name, description, trigger_type, trigger_config, is_template, category) VALUES
    ('Welcome Email Sequence', 'Automated welcome sequence for new leads', 'lead_created', '{"lead_source": "inbound"}', true, 'nurturing'),
    ('Hot Lead Follow-up', 'Immediate follow-up for high-scoring leads', 'lead_score_changed', '{"min_score": 75}', true, 'follow_up'),
    ('Deal Stage Escalation', 'Escalate deals stuck in early stages', 'time_based', '{"delay_days": 7, "stage": "qualified"}', true, 'automation'),
    ('Re-engagement Campaign', 'Re-engage inactive leads', 'time_based', '{"delay_days": 30, "no_activity": true}', true, 'nurturing')
ON CONFLICT (id) DO NOTHING;

-- CONTENT PERSONALIZATION ENGINE TABLES
-- Content Personalization Rules Table
CREATE TABLE IF NOT EXISTS content_personalization_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    content_type TEXT CHECK (content_type IN ('email', 'landing_page', 'social_post', 'ad_copy')) NOT NULL,
    trigger_conditions JSONB DEFAULT '{}', -- When to apply this rule
    personalization_rules JSONB DEFAULT '{}', -- How to personalize content
    ai_enhancement BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    performance_score DECIMAL(5,2) DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personalized Content Cache Table
CREATE TABLE IF NOT EXISTS personalized_content_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    original_content_id UUID, -- ID of original template/content
    personalized_content TEXT NOT NULL,
    personalization_metadata JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Performance Analytics Table
CREATE TABLE IF NOT EXISTS content_performance_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    content_id UUID NOT NULL,
    lead_segment TEXT, -- e.g., 'enterprise', 'startup', 'individual'
    metrics JSONB DEFAULT '{}', -- opens, clicks, conversions, time_spent, etc.
    personalization_factors JSONB DEFAULT '{}', -- what was personalized
    ai_score DECIMAL(5,2), -- AI optimization score
    human_score DECIMAL(5,2), -- Manual quality score
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dynamic Content Blocks Table
CREATE TABLE IF NOT EXISTS dynamic_content_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    block_type TEXT CHECK (block_type IN ('text', 'image', 'cta', 'social_proof', 'testimonials')) NOT NULL,
    content_variants JSONB DEFAULT '[]', -- Array of content variants
    targeting_rules JSONB DEFAULT '{}', -- When to show which variant
    ai_generated BOOLEAN DEFAULT FALSE,
    performance_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Content Optimization Models Table
CREATE TABLE IF NOT EXISTS ai_content_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    model_type TEXT CHECK (model_type IN ('personalization', 'optimization', 'generation')) NOT NULL,
    training_data JSONB DEFAULT '{}',
    model_parameters JSONB DEFAULT '{}',
    accuracy_score DECIMAL(5,4) DEFAULT 0,
    is_active BOOLEAN DEFAULT FALSE,
    last_trained_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time Content Optimization Table
CREATE TABLE IF NOT EXISTS content_optimization_experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    experiment_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    original_content TEXT NOT NULL,
    optimized_variants JSONB DEFAULT '[]',
    target_metric TEXT CHECK (target_metric IN ('open_rate', 'click_rate', 'conversion_rate', 'engagement')) DEFAULT 'engagement',
    status TEXT CHECK (status IN ('running', 'completed', 'paused')) DEFAULT 'running',
    winner_variant_id TEXT,
    confidence_level DECIMAL(5,4) DEFAULT 0.95,
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    results JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for content personalization
CREATE INDEX IF NOT EXISTS idx_content_personalization_rules_user_id ON content_personalization_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_content_personalization_rules_content_type ON content_personalization_rules(content_type);
CREATE INDEX IF NOT EXISTS idx_personalized_content_cache_lead_id ON personalized_content_cache(lead_id);
CREATE INDEX IF NOT EXISTS idx_personalized_content_cache_expires_at ON personalized_content_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_content_performance_analytics_user_id ON content_performance_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_content_blocks_user_id ON dynamic_content_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_content_models_user_id ON ai_content_models(user_id);
CREATE INDEX IF NOT EXISTS idx_content_optimization_experiments_user_id ON content_optimization_experiments(user_id);

-- RLS Policies for content personalization
ALTER TABLE content_personalization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_content_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_performance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamic_content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_content_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_optimization_experiments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their content personalization rules" ON content_personalization_rules FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can access personalized content for their leads" ON personalized_content_cache FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view content performance analytics" ON content_performance_analytics FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their dynamic content blocks" ON dynamic_content_blocks FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their AI content models" ON ai_content_models FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their content optimization experiments" ON content_optimization_experiments FOR ALL USING (user_id = auth.uid());

-- Triggers
CREATE TRIGGER update_content_personalization_rules_updated_at BEFORE UPDATE ON content_personalization_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dynamic_content_blocks_updated_at BEFORE UPDATE ON dynamic_content_blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_content_models_updated_at BEFORE UPDATE ON ai_content_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_optimization_experiments_updated_at BEFORE UPDATE ON content_optimization_experiments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Default content personalization rules
INSERT INTO content_personalization_rules (name, description, content_type, trigger_conditions, personalization_rules, ai_enhancement) VALUES
    ('Enterprise Welcome', 'Personalized welcome for enterprise leads', 'email', '{"company_size": ["1000+", "500-999"]}', '{"greeting": "Dear {{contact_name}} at {{company_name}}", "value_prop": "enterprise_solutions"}', true),
    ('Startup Nurture', 'Growth-focused content for startups', 'email', '{"company_size": ["1-10", "11-50"]}', '{"tone": "casual", "focus": "growth_hacks"}', true),
    ('High-Value Follow-up', 'Premium content for qualified leads', 'email', '{"lead_score": {"min": 75}}', '{"urgency": "high", "cta": "schedule_demo"}', true),
    ('Industry-Specific Content', 'Tailored messaging by industry', 'landing_page', '{"industry": ["technology", "finance"]}', '{"industry_insights": true, "case_studies": "relevant"}', true)
ON CONFLICT (id) DO NOTHING;

-- Comments
COMMENT ON TABLE content_personalization_rules IS 'Rules for dynamic content personalization';
COMMENT ON TABLE personalized_content_cache IS 'Cached personalized content versions';
COMMENT ON TABLE content_performance_analytics IS 'Analytics for personalized content performance';
COMMENT ON TABLE dynamic_content_blocks IS 'Reusable dynamic content components';
COMMENT ON TABLE ai_content_models IS 'AI models for content optimization and generation';
COMMENT ON TABLE content_optimization_experiments IS 'Real-time A/B testing for content optimization';
COMMENT ON TABLE lead_scoring_rules IS 'Automated lead scoring rules';
COMMENT ON TABLE lead_scores IS 'Calculated lead scores and qualification levels';
COMMENT ON TABLE team_members IS 'Team member profiles and permissions';
COMMENT ON TABLE sales_forecasts IS 'Sales forecasting data';
