#!/usr/bin/env bash

ensureOnMainBranch() {
  local DESIRED_BRANCH="main"
  local CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

  if [ "$CURRENT_BRANCH" != "$DESIRED_BRANCH" ]
  then
    echo "Error: You are not on the $DESIRED_BRANCH branch. Current branch is $CURRENT_BRANCH." >&2
    exit 1
  else
    echo "Confirmed: On $DESIRED_BRANCH branch."
  fi
}

ensureCleanBranch() {
  # Check for uncommitted changes
  if [ -n "$(git status --porcelain)" ]
  then
    echo "Error: There are uncommitted changes in the current directory." >&2
    exit 1
  else
    echo "Confirmed: No uncommitted changes"
  fi

  # Check for not pushed changes
  if git fetch origin main && [ -n "$(git cherry -v origin/main)" ]
  then
    echo "Error: There are changes not pushed to remote."
    exit 1
  else
    echo "Confirmed: No changes need to be pushed to remote"
  fi
}


ensureFileReadableAndHasData() {
  local FILE_PATH="$1"

  if [ ! -s ${FILE_PATH} ]
  then
    echo "Error: File ${FILE_PATH} does not exist or is empty." >&2
    exit 1
  else
    echo "Confirmed: File $FILE_PATH exists and is readable."
  fi
}

confirmContinue() {
  while true
  do
    read -p "Do you wish to continue? (y/n) " yn
    case $yn in
      [Yy]* ) return 0;;
      [Nn]* ) return 1;;
      * ) echo "Please answer yes or no.";;
    esac
  done
}

ensureOnMainBranch
ensureCleanBranch

FILE_MANIFEST="manifest.json"
FILE_PACKAGE="package.json"
FILE_ICAL_SERVICE="src/IcalService.ts"

ensureFileReadableAndHasData "$FILE_MANIFEST"
ensureFileReadableAndHasData "$FILE_PACKAGE"
ensureFileReadableAndHasData "$FILE_ICAL_SERVICE"

CURRENT_VERSION_MANIFEST=$(awk -F'"' '/"version":/ {print $4; exit}' "${FILE_MANIFEST}" | xargs)
echo "Confirmed: Current version in $FILE_MANIFEST is ${CURRENT_VERSION_MANIFEST}"

CURRENT_VERSION_PACKAGE=$(awk -F'"' '/"version":/ && !seen {seen=1; print $4}' "${FILE_PACKAGE}" | xargs)
echo "Confirmed: Current version in $FILE_PACKAGE is ${CURRENT_VERSION_PACKAGE}"

CURRENT_VERSION_ICAL_SERVICE=$(grep 'PRODID:' "${FILE_ICAL_SERVICE}" | awk -F'v' '{print $2}' | awk -F'//' '{print $1}' | xargs)
echo "Confirmed: Current version in $FILE_ICAL_SERVICE is ${CURRENT_VERSION_ICAL_SERVICE}"

if [[ "$CURRENT_VERSION_MANIFEST" != "$CURRENT_VERSION_PACKAGE" ]] || [[ "$CURRENT_VERSION_MANIFEST" != "$CURRENT_VERSION_ICAL_SERVICE" ]]; then
  echo "Error: Version numbers do not match across files." >&2
  exit 1
fi

# All versions match so make CURRENT_VERSION be one of them
CURRENT_VERSION=${CURRENT_VERSION_MANIFEST}

VERSION_PATTERN="^[0-9]+\.[0-9]+\.[0-9]+$"

while true
do
  read -p "Enter the new version (format: number.number.number, e.g., 1.16.0): " NEW_VERSION

  if [[ $NEW_VERSION =~ $VERSION_PATTERN ]]
  then
    echo "New version set to: $NEW_VERSION"
    break
  else
    echo "Error: The input does not match the required format (number.number.number). Please try again." >&2
  fi
done

sed -i '' "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$NEW_VERSION\"/" $FILE_MANIFEST
sed -i '' "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$NEW_VERSION\"/" $FILE_PACKAGE
sed -i '' "s/obsidian-ical-plugin v[0-9.]*\/\/EN/obsidian-ical-plugin v${NEW_VERSION}\/\/EN/" "$FILE_ICAL_SERVICE"

echo "Version numbers updated in all files."

git diff

if confirmContinue
then
  git commit -a -m "Upgrade version from ${CURRENT_VERSION} to ${NEW_VERSION}"
  git push
  git tag -a "${NEW_VERSION}" -m "${NEW_VERSION}"
  git push origin ${NEW_VERSION}
  echo "Done!"
else
  echo "Reverting version changes.."
  git checkout $FILE_MANIFEST
  git checkout $FILE_PACKAGE
  git checkout $FILE_ICAL_SERVICE
  echo "Exiting..."
  exit 1
fi
