# How testing

This Markdown file lives inside the `test` Obsidian vault. It contains a large collection of tasks in various permutations to test different scenarios.

Each task should have a `id=X` where `X` is a unique number. This is necessary for automated testing, the test could query the iCalendar file for a specific task ID to ensure it is correct.

## Bare dates
### Bare
- [ ] id=21, todo, bare date, 2024-01-01
- [x] id=22, done, bare date, 2024-01-01
- [-] id=23, cancelled, bare date, 2024-01-01
- [/] id=24, in progress, bare date, 2024-01-01
### Tags
- [ ] id=25, #tag, todo, bare date, 2024-01-01
- [x] id=26, #tag, done, bare date, 2024-01-01
- [-] id=27, #tag, cancelled, bare date, 2024-01-01
- [/] id=28, #tag, in progress, bare date, 2024-01-01
## Wikilinks
- [ ] id=29, todo, bare date, [[wikilink link bare]], 2024-01-01
- [x] id=30, done, bare date, [[wikilink link bare]], 2024-01-01
- [-] id=31, cancelled, bare date, [[wikilink link bare]], 2024-01-01
- [/] id=32, in progress, bare date, [[wikilink link bare]], 2024-01-01
### Wikilinks with title
- [ ] id=33, todo, bare date, [[wikilink link bare|wikilink title]], 2024-01-01
- [x] id=34, done, bare date, [[wikilink link bare|wikilink title]], 2024-01-01
- [-] id=35, cancelled, bare date, [[wikilink link bare|wikilink title]], 2024-01-01
- [/] id=36, in progress, bare date, [[wikilink link bare|wikilink title]], 2024-01-01
### Markdown links
- [ ] id=37, todo, bare date, [markdown title](markdown link), 2024-01-01
- [x] id=38, done, bare date, [markdown title](markdown link), 2024-01-01
- [-] id=39, cancelled, bare date, [markdown title](markdown link), 2024-01-01
- [/] id=40, in progress, bare date, [markdown title](markdown link), 2024-01-01
