DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'actual_delivery_time'
    ) THEN
        ALTER TABLE orders ADD COLUMN actual_delivery_time TIMESTAMP;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'accepted_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN accepted_at TIMESTAMP;
    END IF;
END $$; 