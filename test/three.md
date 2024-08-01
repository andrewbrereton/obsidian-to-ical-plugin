# Testing

This Markdown file lives inside the `test` Obsidian vault. It contains a large collection of tasks in various permutations to test different scenarios.

Each task should have a `id=X` where `X` is a unique number. This is so if I add automated testing later, the test can interrogate the iCalendar file for the specific task `id` to ensure it is correct.

## No Dates
### Bare
- [ ] id=1, todo, no dates
- [ ] id=2, done, no dates
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
### Daily Planner
#### 2024-01-01

- [ ] 17:01 id=129, start time only, (hour)(:)(minute) format
- [ ] 17:02:00 id=130, start time only, (hour)(:)(minute)(:)(second) format
- [ ] 5pm id=131, start time only, (hour)(am|pm) format
- [ ] 5:03pm id=132, start time only, (hour)(:)(minute)(am|pm) format
- [ ] 5:04:00pm id=133, start time only, (hour)(:)(minute)(:)(second)(am|pm) format
- [ ] 5 pm id=134, start time only, (hour)(space)(am|pm) format
- [ ] 5:03 pm id=135, start time only, (hour)(:)(minute)(space)(am|pm) format
- [ ] 5:04:00 pm id=136, start time only, (hour)(:)(minute)(:)(second)(space)(am|pm) format

#### 2024-01-02

- [ ] 17:05 - 17:06 id=137, start time and end time, (hour)(:)(minute) format
- [ ] 17:06:00 - 17:07:00 id=138, start time and end time, (hour)(:)(minute)(:)(second) format
- [ ] 5pm - 6pm id=139, start time and end time, (hour)(am|pm) format
- [ ] 5:07pm - 5:08pm id=140, start time and end time, (hour)(:)(minute)(am|pm) format
- [ ] 5:08:00pm - 5:09:00pm id=141, start time and end time, (hour)(:)(minute)(:)(second)(am|pm) format
- [ ] 5 pm - 6 pm id=142, start time and end time, (hour)(space)(am|pm) format
- [ ] 5:09 pm - 5:10 pm id=143, start time and end time, (hour)(:)(minute)(space)(am|pm) format
- [ ] 5:10:00 pm - 5:11:00 pm id=144, start time and end time, (hour)(:)(minute)(:)(second)(space)(am|pm) format

#### 2024-01-03

- [ ] 17:11-17:12 id=145, start time and end time, (hour)(:)(minute) format
- [ ] 17:12:00-17:13:00 id=146, start time and end time, (hour)(:)(minute)(:)(second) format
- [ ] 5pm-6pm id=147, start time and end time, (hour)(am|pm) format
- [ ] 5:13pm-5:14pm id=148, start time and end time, (hour)(:)(minute)(am|pm) format
- [ ] 5:14:00pm-5:15:00pm id=149, start time and end time, (hour)(:)(minute)(:)(second)(am|pm) format
- [ ] 5 pm-6 pm id=150, start time and end time, (hour)(space)(am|pm) format
- [ ] 5:15 pm-5:16 pm id=151, start time and end time, (hour)(:)(minute)(space)(am|pm) format
- [ ] 5:16:00 pm-5:17:00 pm id=152, start time and end time, (hour)(:)(minute)(:)(second)(space)(am|pm) format

### Include and exclude based on tags

- [ ] id=153 include because of #include1
- [ ] id=154 include because of #include2
- [ ] id=155 include because of #include1 and #include2
- [ ] id=156 exclude because of #exclude1
- [ ] id=157 exclude because of #exclude2
- [ ] id=158 exclude because of #exclude1 and #exclude2
- [ ] id=159 exclude based of #exclude1 even though there is also a #include1
