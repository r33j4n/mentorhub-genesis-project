-- Add speaker and company information to public_seminars table
ALTER TABLE public_seminars 
ADD COLUMN IF NOT EXISTS speaker_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS speaker_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS speaker_bio TEXT,
ADD COLUMN IF NOT EXISTS speaker_image VARCHAR(500),
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS company_logo VARCHAR(500),
ADD COLUMN IF NOT EXISTS company_website VARCHAR(500),
ADD COLUMN IF NOT EXISTS is_company_sponsored BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public_seminars.speaker_name IS 'Name of the main speaker/presenter';
COMMENT ON COLUMN public_seminars.speaker_title IS 'Job title or role of the speaker';
COMMENT ON COLUMN public_seminars.speaker_bio IS 'Brief biography of the speaker';
COMMENT ON COLUMN public_seminars.speaker_image IS 'URL to speaker profile image';
COMMENT ON COLUMN public_seminars.company_name IS 'Name of the company providing the session';
COMMENT ON COLUMN public_seminars.company_logo IS 'URL to company logo';
COMMENT ON COLUMN public_seminars.company_website IS 'Company website URL';
COMMENT ON COLUMN public_seminars.is_company_sponsored IS 'Whether this seminar is sponsored by a company';
