#!/bin/bash

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Install/update requirements
pip install -r requirements.txt

# Start Gunicorn
gunicorn -c gunicorn_config.py app:app 