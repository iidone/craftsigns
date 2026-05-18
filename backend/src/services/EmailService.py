import os
import smtplib
from email.message import EmailMessage
from typing import Iterable


def _get_recipients() -> list[str]:
    raw = os.getenv("ADMIN_EMAILS") or os.getenv("ADMIN_EMAIL") or ""
    return [email.strip() for email in raw.split(",") if email.strip()]


def send_email(subject: str, body: str, recipients: Iterable[str] | None = None) -> bool:
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_FROM") or username
    target_recipients = list(recipients or _get_recipients())

    if not host or not sender or not target_recipients:
        print(f"Email skipped: {subject}\n{body}")
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = sender
    message["To"] = ", ".join(target_recipients)
    message.set_content(body)

    with smtplib.SMTP(host, port) as smtp:
        smtp.starttls()
        if username and password:
            smtp.login(username, password)
        smtp.send_message(message)

    return True
