# Testing

This Markdown file lives inside the `test` Obsidian vault. It contains a large collection of tasks in various permutations to test different scenarios.

Each task should have a `id=X` where `X` is a unique number. This is so if I add automated testing later, the test can interrogate the iCalendar file for the specific task `id` to ensure it is correct.

## No Dates
### Bare
- [ ] id=1, todo, no dates
- [x] id=2, done, no dates
- [-] id=3, cancelled, no dates
- [/] id=4, in progress, no dates
### Tags
- [ ] id=5, #tag, todo, no dates
- [x] id=6, #tag, done, no dates
- [-] id=7, #tag, cancelled, no dates
- [/] id=8, #tag, in progress, no dates
## Wikilinks
- [ ] id=9, todo, no dates, [[wikilink link bare]]
- [x] id=10, done, no dates, [[wikilink link bare]]
- [-] id=11, cancelled, no dates, [[wikilink link bare]]
- [/] id=12, in progress, no dates, [[wikilink link bare]]
### Wikilinks with title
- [ ] id=13, todo, no dates, [[wikilink link bare|wikilink title]]
- [x] id=14, done, no dates, [[wikilink link bare|wikilink title]]
- [-] id=15, cancelled, no dates, [[wikilink link bare|wikilink title]]
- [/] id=16, in progress, no dates, [[wikilink link bare|wikilink title]]
### Markdown links
- [ ] id=17, todo, no dates, [markdown title](markdown link)
- [x] id=18, done, no dates, [markdown title](markdown link)
- [-] id=19, cancelled, no dates, [markdown title](markdown link)
- [/] id=20, in progress, no dates, [markdown title](markdown link)

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

## Due Dates (Emoji format)
### Bare
- [ ] id=41, todo, 📅 2024-01-01
- [x] id=42, done, 📅 2024-01-01
- [-] id=43, cancelled, 📅 2024-01-01
- [/] id=44, in progress, 📅 2024-01-01
### Tags
- [ ] id=45, #tag, todo, 📅 2024-01-01
- [x] id=46, #tag, done, 📅 2024-01-01
- [-] id=47, #tag, cancelled, 📅 2024-01-01
- [/] id=48, #tag, in progress, 📅 2024-01-01
## Wikilinks
- [ ] id=49, todo, 📅 2024-01-01 [[wikilink link bare]]
- [x] id=50, done, 📅 2024-01-01 [[wikilink link bare]]
- [-] id=51, cancelled, 📅 2024-01-01 [[wikilink link bare]]
- [/] id=52, in progress, 📅 2024-01-01 [[wikilink link bare]]
### Wikilinks with title
- [ ] id=53, todo, 📅 2024-01-01 [[wikilink link bare|wikilink title]]
- [x] id=54, done, 📅 2024-01-01 [[wikilink link bare|wikilink title]]
- [-] id=55, cancelled, 📅 2024-01-01 [[wikilink link bare|wikilink title]]
- [/] id=56, in progress, 📅 2024-01-01 [[wikilink link bare|wikilink title]]
### Markdown links
- [ ] id=57, todo, 📅 2024-01-01 [markdown title](markdown link)
- [x] id=58, done, 📅 2024-01-01 [markdown title](markdown link)
- [-] id=59, cancelled, 📅 2024-01-01 [markdown title](markdown link)
- [/] id=60, in progress, 📅 2024-01-01 [markdown title](markdown link)

## Due Dates (Dataview format)
### Bare
- [ ] id=61, todo, [due:: 2024-01-01]
- [x] id=62, done, [due:: 2024-01-01]
- [-] id=63, cancelled, [due:: 2024-01-01]
- [/] id=64, in progress, [due:: 2024-01-01]
### Tags
- [ ] id=65, #tag, todo, [due:: 2024-01-01]
- [x] id=66, #tag, done, [due:: 2024-01-01]
- [-] id=67, #tag, cancelled, [due:: 2024-01-01]
- [/] id=68, #tag, in progress, [due:: 2024-01-01]
## Wikilinks
- [ ] id=69, todo, [due:: 2024-01-01] [[wikilink link bare]]
- [x] id=70, done, [due:: 2024-01-01] [[wikilink link bare]]
- [-] id=71, cancelled, [due:: 2024-01-01] [[wikilink link bare]]
- [/] id=72, in progress, [due:: 2024-01-01] [[wikilink link bare]]
### Wikilinks with title
- [ ] id=73, todo, [due:: 2024-01-01] [[wikilink link bare|wikilink title]]
- [x] id=74, done, [due:: 2024-01-01] [[wikilink link bare|wikilink title]]
- [-] id=75, cancelled, [due:: 2024-01-01] [[wikilink link bare|wikilink title]]
- [/] id=76, in progress, [due:: 2024-01-01] [[wikilink link bare|wikilink title]]
### Markdown links
- [ ] id=77, todo, [due:: 2024-01-01] [markdown title](markdown link)
- [x] id=78, done, [due:: 2024-01-01] [markdown title](markdown link)
- [-] id=79, cancelled, [due:: 2024-01-01] [markdown title](markdown link)
- [/] id=80, in progress, [due:: 2024-01-01] [markdown title](markdown link)

## Emoji date combinations
### Due
- [ ] id=81, todo, 📅 2024-01-01
- [x] id=82, done, 📅 2024-01-01
- [-] id=83, cancelled, 📅 2024-01-01
- [/] id=84, in progress, 📅 2024-01-01
### Due, Created
- [ ] id=85, todo, 📅 2024-01-01 ➕ 2024-01-01
- [x] id=86, done, 📅 2024-01-01 ➕ 2024-01-01
- [-] id=87, cancelled, 📅 2024-01-01 ➕ 2024-01-01
- [/] id=88, in progress, 📅 2024-01-01 ➕ 2024-01-01
### Due, Created, Scheduled
- [ ] id=89, todo, 📅 2024-01-01 ➕ 2024-01-01 ⏳ 2024-01-01
- [x] id=90, done, 📅 2024-01-01 ➕ 2024-01-01 ⏳ 2024-01-01
- [-] id=91, cancelled, 📅 2024-01-01 ➕ 2024-01-01 ⏳ 2024-01-01
- [/] id=92, in progress, 📅 2024-01-01 ➕ 2024-01-01 ⏳ 2024-01-01
### Due, Created, Scheduled, Started
- [ ] id=93, todo, 📅 2024-01-01 ➕ 2024-01-01 ⏳ 2024-01-01 🛫 2024-01-01
- [x] id=94, done, 📅 2024-01-01 ➕ 2024-01-01 ⏳ 2024-01-01 🛫 2024-01-01
- [-] id=95, cancelled, 📅 2024-01-01 ➕ 2024-01-01 ⏳ 2024-01-01 🛫 2024-01-01
- [/] id=96, in progress, 📅 2024-01-01 ➕ 2024-01-01 ⏳ 2024-01-01 🛫 2024-01-01
### Due, Created, Scheduled, Started, Done
- [ ] id=97, todo, 📅 2024-01-01 ➕ 2024-01-01 ⏳ 2024-01-01 🛫 2024-01-01 ✅ 2024-01-01
- [x] id=98, done, 📅 2024-01-01 ➕ 2024-01-01 ⏳ 2024-01-01 🛫 2024-01-01 ✅ 2024-01-01
- [-] id=99, cancelled, 📅 2024-01-01 ➕ 2024-01-01 ⏳ 2024-01-01 🛫 2024-01-01 ✅ 2024-01-01
- [/] id=100, in progress, 📅 2024-01-01 ➕ 2024-01-01 ⏳ 2024-01-01 🛫 2024-01-01 ✅ 2024-01-01
### Due, Created, Scheduled, Started, Cancelled
- [ ] id=101, todo, 📅 2024-01-01 ➕ 2024-01-01 ⏳ 2024-01-01 🛫 2024-01-01 ❌ 2024-01-01
- [x] id=102, done, 📅 2024-01-01 ➕ 2024-01-01 ⏳ 2024-01-01 🛫 2024-01-01 ❌ 2024-01-01
- [-] id=103, cancelled, 📅 2024-01-01 ➕ 2024-01-01 ⏳ 2024-01-01 🛫 2024-01-01 ❌ 2024-01-01
- [/] id=104, in progress, 📅 2024-01-01 ➕ 2024-01-01 ⏳ 2024-01-01 🛫 2024-01-01 ❌ 2024-01-01

## Dataview date combinations
### Due
- [ ] id=105, todo, [due:: 2024-01-01]
- [x] id=106, done, [due:: 2024-01-01]
- [-] id=107, cancelled, [due:: 2024-01-01]
- [/] id=108, in progress, [due:: 2024-01-01]
### Due, Created
- [ ] id=109, todo, [due:: 2024-01-01] [created:: 2024-01-01]
- [x] id=110, done, [due:: 2024-01-01] [created:: 2024-01-01]
- [-] id=111, cancelled, [due:: 2024-01-01] [created:: 2024-01-01]
- [/] id=112, in progress, [due:: 2024-01-01] [created:: 2024-01-01]
### Due, Created, Scheduled
- [ ] id=113, todo, [due:: 2024-01-01] [created:: 2024-01-01] [scheduled:: 2024-01-01]
- [x] id=114, done, [due:: 2024-01-01] [created:: 2024-01-01] [scheduled:: 2024-01-01]
- [-] id=115, cancelled, [due:: 2024-01-01] [created:: 2024-01-01] [scheduled:: 2024-01-01]
- [/] id=116, in progress, [due:: 2024-01-01] [created:: 2024-01-01] [scheduled:: 2024-01-01]
### Due, Created, Scheduled, Start
- [ ] id=117, todo, [due:: 2024-01-01] [created:: 2024-01-01] [scheduled:: 2024-01-01] [start:: 2024-01-01]
- [x] id=118, done, [due:: 2024-01-01] [created:: 2024-01-01] [scheduled:: 2024-01-01] [start:: 2024-01-01]
- [-] id=119, cancelled, [due:: 2024-01-01] [created:: 2024-01-01] [scheduled:: 2024-01-01] [start:: 2024-01-01]
- [/] id=120, in progress, [due:: 2024-01-01] [created:: 2024-01-01] [scheduled:: 2024-01-01] [start:: 2024-01-01]
### Due, Created, Scheduled, Start, Done
- [ ] id=121, todo, [due:: 2024-01-01] [created:: 2024-01-01] [scheduled:: 2024-01-01] [start:: 2024-01-01] [completion:: 2024-01-01]
- [x] id=122, done, [due:: 2024-01-01] [created:: 2024-01-01] [scheduled:: 2024-01-01] [start:: 2024-01-01] [completion:: 2024-01-01]
- [-] id=123, cancelled, [due:: 2024-01-01] [created:: 2024-01-01] [scheduled:: 2024-01-01] [start:: 2024-01-01] [completion:: 2024-01-01]
- [/] id=124, in progress, [due:: 2024-01-01] [created:: 2024-01-01] [scheduled:: 2024-01-01] [start:: 2024-01-01] [completion:: 2024-01-01]
### Due, Created, Scheduled, Start, Cancelled
- [ ] id=125, todo, [due:: 2024-01-01] [created:: 2024-01-01] [scheduled:: 2024-01-01] [start:: 2024-01-01] [cancelled:: 2024-01-01]
- [x] id=126, done, [due:: 2024-01-01] [created:: 2024-01-01] [scheduled:: 2024-01-01] [start:: 2024-01-01] [cancelled:: 2024-01-01]
- [-] id=127, cancelled, [due:: 2024-01-01] [created:: 2024-01-01] [scheduled:: 2024-01-01] [start:: 2024-01-01] [cancelled:: 2024-01-01]
- [/] id=128, in progress, [due:: 2024-01-01] [created:: 2024-01-01] [scheduled:: 2024-01-01] [start:: 2024-01-01] [cancelled:: 2024-01-01]
