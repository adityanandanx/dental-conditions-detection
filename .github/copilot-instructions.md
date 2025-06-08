We are using uv as package manager for the python fastapi backend and not pip. please use the command `uv add` to add new dependencies
instead of pip

We always write typesafe code in typescript for frontend and pydantic v2 for python. So when your responses include python or javascript code, please follow those conventions.

Do not give any command to run the server, whether it is frontend or backend assume the user's machine already has the server running.

Update the `README.md` file whenever a functionality changes. DO NOT CHANGE IT'S FORMAT. FOLLOW THE WAY THINGS ARE WRITTEN.

# Frontend Specific instructions

- Use pnpm package manager.
- Use typescript
- Extract common or shared types into `frontend/src/lib/types.ts`
- I am using shadcn/ui for the ui components. if you need any run the command `pnpm dlx shadcn@latest add <component>`. Do not manually create new files in the `frontend/src/components/ui` folder
- For api calls, use tanstack react query along with the custom axios instance as defined in `frontend/src/lib/axios.ts` to create custom hooks for each endpoint.
- We are using tailwind v4

# Backend Specific instructions

- FastAPI backend with uv package manager.
- Keep everything typesafe using pydantic v4
- DO NOT EDIT `pyproject.toml` FILE DIRECTLY AT ANY COST.
