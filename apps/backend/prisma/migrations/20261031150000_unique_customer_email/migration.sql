DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "customers"
    GROUP BY lower(trim("email"))
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot add unique customer email constraint: duplicate normalized customer emails exist';
  END IF;
END $$;

CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");
CREATE UNIQUE INDEX "customers_email_normalized_key"
  ON "customers"(lower(trim("email")));
