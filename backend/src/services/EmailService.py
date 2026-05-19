import os
import smtplib
from email.message import EmailMessage
from typing import Iterable


def send_email(subject: str, body: str, recipients: Iterable[str]) -> bool:
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_FROM") or username
    target_recipients = list(recipients)

    missing = []
    if not host:
        missing.append("SMTP_HOST")
    if not sender:
        missing.append("SMTP_FROM/SMTP_USER")
    if not target_recipients:
        missing.append("recipients")

    if missing:
        print(
            "Email skipped (missing: %s): %s\n%s" % (", ".join(missing), subject, body)
        )
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = sender
    message["To"] = ", ".join(target_recipients)
    message.set_content(body)

    try:
        with smtplib.SMTP(host, port) as smtp:
            smtp.starttls()
            if username and password:
                smtp.login(username, password)
            smtp.send_message(message)
        return True
    except Exception as e:
        print(f"Email send error: {e}")
        return False

