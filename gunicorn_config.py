import multiprocessing

# Server socket
bind = "0.0.0.0:8000"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# Logging
accesslog = "access.log"
errorlog = "error.log"
loglevel = "info"

# Process naming
proc_name = "food_vision"

# Server mechanics
daemon = False
pidfile = "gunicorn.pid"
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL
keyfile = None
certfile = None 