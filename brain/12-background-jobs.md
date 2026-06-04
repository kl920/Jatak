# 12 – Background Jobs

## Status

**None.**

There are no background jobs, task queues, or scheduled processes in this project.

- No Celery, RQ, Dramatiq, APScheduler, or cron jobs
- No WebSockets or Server-Sent Events
- No data pipeline or ETL process
- No scheduled data refresh

## Implications

- Data is static — the Parquet file must be manually updated with new data
- The AI endpoint (`/api/ai/suggest`) calls OpenAI synchronously and can take 5-15 seconds
- No cache warming or pre-computation
- The in-memory cache (`utils/cache.py`) is defined but unused

## If background jobs were needed

Likely use cases:
1. **Scheduled data refresh** — fetch new Ja Tak data from a source (currently unknown how the Parquet is produced)
2. **Cache warming** — pre-compute expensive queries after data refresh
3. **AI request queuing** — if multiple users generate offer texts simultaneously
