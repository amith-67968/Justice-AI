# Supabase Backend Setup (JusticeGPT)

## Database Tables

* cases
* documents
* ai_data
* events
* messages

## Relationships

* cases → user_id
* documents → case_id
* ai_data → case_id
* events → case_id
* messages → case_id

## Storage

Bucket: case-documents

## File Flow

Upload file → Storage → Save path in documents table

## Important Rule

Everything is connected using case_id

## AI Data

Stored in JSON format (jsonb)

## Security

Row Level Security (RLS) enabled
Users can only access their own data

## Credentials Needed

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
