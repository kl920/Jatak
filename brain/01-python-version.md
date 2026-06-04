# 01 – Python Version

## Version used

**Python 3.12**

## Evidence

- Virtual environment located at `backend/.venv/` (created with `python -m venv .venv`)
- `setup.ps1` calls bare `python -m venv .venv` — relies on system Python 3.12
- No `pyproject.toml`, no `.python-version`, no `runtime.txt` specifying an exact version
- Dependencies in `requirements.txt` are pinned to specific versions compatible with 3.12

## Compatibility notes

- **Python 3.11+:** No issues. All syntax used is 3.10+ compatible.
- **Python 3.10:** Works. Uses `set | None` type union syntax (PEP 604) which requires 3.10+.
- **Python 3.9 or lower:** Will fail due to `set | None` syntax in `churn.py` and walrus operators elsewhere.

## Recommendation

- Pin Python version in a `.python-version` file or `pyproject.toml`
- The `set | None` type hints in `churn.py` (line 21-22) could use `Optional[set]` for broader compatibility
