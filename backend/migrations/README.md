# Migrations

This folder is populated by Flask-Migrate. After setting up your `.env` and MySQL database:

```bash
pip install -r requirements.txt --break-system-packages   # or in a venv, without the flag
export FLASK_APP=run.py
flask db init          # only once, creates this folder's contents
flask db migrate -m "Initial models: users, customers, drivers, vehicles"
flask db upgrade
```

Re-run `flask db migrate` + `flask db upgrade` after adding new models in later phases
(trips, bookings, payments, etc.).
