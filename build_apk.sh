#!/bin/bash
set -e
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home
cd "$(dirname "$0")/android"
./gradlew assembleRelease --no-daemon -q \
  -Pandroid.injected.signing.store.file="$PWD/taskflow-release.keystore" \
  -Pandroid.injected.signing.store.password='TaskFlow2026!' \
  -Pandroid.injected.signing.key.alias='taskflow' \
  -Pandroid.injected.signing.key.password='TaskFlow2026!'
echo "APK build complete!"
