<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Admin financial and statistic values must wrap responsively and remain fully visible; never truncate monetary data.
- Host overview modules live under `src/components/host/overview/` so the large host route remains focused on section orchestration.
- Every page rendered inside the shared account shell is private and redirects signed-out visitors to the landing page before showing account content.
