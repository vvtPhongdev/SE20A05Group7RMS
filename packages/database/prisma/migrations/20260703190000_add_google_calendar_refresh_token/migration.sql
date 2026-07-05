-- Luu refresh_token Google Calendar cho HR/Interviewer de he thong co the
-- tu dong tao Google Meet ma khong can nguoi dung dang nhap Google lai.
ALTER TABLE "users"
ADD COLUMN "google_calendar_refresh_token" TEXT;
