# 99 – Open Questions

Questions that cannot be answered from the codebase alone. Require input from the original developer or stakeholders.

## Data origin

1. **Where does `jatak.parquet` come from?**
   No ETL pipeline, no import script, no data source documentation. The 680K-row Parquet file is checked into Git LFS. How is it generated? Who updates it? How often?

2. **What system produces the raw Facebook "Ja Tak" data?**
   The columns suggest some external system: `kardex_id`, `jatak_count`, `total_sold`, `initial_stock`. Is this a manual export from Coop's internal tools, an automated pipeline, or scraped from Facebook?

3. **Are the current `category` values stable?**
   Categories like "Kød & Slagter", "Mejeri" etc. appear to be free-text from the source. Are they normalized upstream or do new categories appear over time?

## Business logic

4. **What defines "churn"?**
   `churn.py` compares two Excel lists (`api_stores_list.xlsx` and `active_stores_list_2026.xlsx`) to find stores that stopped/started using the platform. Where do these Excel files come from? How current are they?

5. **What are the KPI targets?**
   The KPI page computes sell-through rate, average Ja Tak count, etc. Are there target values or benchmarks? The code doesn't reference any.

6. **What date range is "current"?**
   The filter defaults show `min_date` → `max_date` from the Parquet data. Is there a concept of "current campaign" or "active period"?

## Users & access

7. **Who are the intended users?**
   The code uses Coop branding. Is this for Coop headquarters, regional managers, individual store managers, or all of the above?

8. **Is the single username/password sufficient?**
   Only one credential set exists (`Coop`/`Jatak12+`). Is per-user authentication needed? Are there different roles or permission levels?

9. **Should the static GitHub Pages deployment be public?**
   The deployed site is accessible to anyone with the URL. The data includes store names and performance metrics. Is this intentional?

## AI feature

10. **Who pays for the OpenAI API usage?**
    The AI Generator page asks each user to paste their own OpenAI API key. Is there a shared organizational key? Should there be usage limits?

11. **Are the AI-generated Facebook posts reviewed before use?**
    The generator creates ready-to-post text. Is there a review/approval workflow, or do store managers post directly?

## Infrastructure

12. **Is there a plan for CI/CD?**
    No pipeline exists. Is the current manual deploy workflow (run export → build → gh-pages) intentional, or should this be automated?

13. **Who maintains this project going forward?**
    No CODEOWNERS, no CONTRIBUTING.md, no documentation of team ownership.

14. **Is the `seed.py` file intentional?**
    It generates 2M rows of synthetic data with categories completely different from production. It's never called by `setup.ps1`. Is it leftover from initial development?

## Data files in `backend/data/`

15. **What are all the `check_*.py` and `count_*.py` scripts?**
    Multiple ad-hoc analysis scripts exist (`check_metrics.py`, `check_turnover.py`, `check_price_2026.py`, etc.) with their stdout/stderr output files. Are these one-off investigations or ongoing monitoring?
