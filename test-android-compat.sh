#!/bin/bash

# Test script to verify the Android ARM64 fixes work
echo "🧪 Testing Android ARM64 compatibility fixes..."
echo

# Test 1: Regular installation
echo "📦 Testing regular npm install..."
rm -rf node_modules package-lock.json
npm install --silent >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Regular install: SUCCESS"
else
    echo "❌ Regular install: FAILED"
fi

# Test 2: Android install script
echo "📱 Testing Android install script..."
rm -rf node_modules
npm run install:android --silent >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Android install script: SUCCESS"
else
    echo "❌ Android install script: FAILED"
fi

# Test 3: Safe install script
echo "🛡️  Testing safe install script..."
rm -rf node_modules
npm run install:safe --silent >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Safe install script: SUCCESS"
else
    echo "❌ Safe install script: FAILED"
fi

# Test 4: Build test
echo "🏗️  Testing build..."
npm run build --silent >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Build: SUCCESS"
else
    echo "❌ Build: FAILED"
fi

# Test 5: Dev server start test (quick check)
echo "🚀 Testing dev server start..."
timeout 5 npm run dev >/dev/null 2>&1
if [ $? -eq 124 ]; then  # timeout exit code means server started successfully
    echo "✅ Dev server: SUCCESS"
else
    echo "❌ Dev server: FAILED"
fi

echo
echo "🎉 Android ARM64 compatibility test complete!"
echo "📖 For detailed troubleshooting, see ANDROID_ARM64_GUIDE.md"