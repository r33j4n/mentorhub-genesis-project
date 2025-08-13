-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trigger_update_seminar_participant_count ON seminar_participants;
DROP FUNCTION IF EXISTS update_seminar_participant_count();

-- Recreate the function with proper security context
CREATE OR REPLACE FUNCTION update_seminar_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public_seminars 
        SET current_participants = COALESCE(current_participants, 0) + 1
        WHERE id = NEW.seminar_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public_seminars 
        SET current_participants = GREATEST(COALESCE(current_participants, 0) - 1, 0)
        WHERE id = OLD.seminar_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER trigger_update_seminar_participant_count
    AFTER INSERT OR DELETE ON seminar_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_seminar_participant_count();

-- Also add a function to recalculate all participant counts (for fixing existing data)
CREATE OR REPLACE FUNCTION recalculate_seminar_participant_counts()
RETURNS void AS $$
BEGIN
    UPDATE public_seminars 
    SET current_participants = (
        SELECT COUNT(*) 
        FROM seminar_participants 
        WHERE seminar_participants.seminar_id = public_seminars.id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the recalculation to fix any existing data
SELECT recalculate_seminar_participant_counts();
