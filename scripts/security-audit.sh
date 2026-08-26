#!/bin/bash
# Security audit script for the project
# Run: ./scripts/security-audit.sh

set -e

echo "🔒 Security Audit Starting..."
echo "================================"

ISSUES=0

# 1. Check for hardcoded secrets
echo ""
echo "1. Checking for hardcoded secrets..."
if grep -rn "password\s*[:=]\s*[\"']" --include="*.ts" --include="*.tsx" --include="*.js" . 2>/dev/null | grep -v "node_modules" | grep -v ".env"; then
  echo "   ❌ Potential hardcoded passwords found"
  ISSUES=$((ISSUES + 1))
else
  echo "   ✅ No hardcoded passwords"
fi

# 2. Check for .env files in git (excluding .env.example)
echo ""
echo "2. Checking for .env files in git..."
if git ls-files | grep -E '\.env$|\.env\.' | grep -v '\.env\.example' | grep -q .; then
  echo "   ❌ .env files are tracked in git"
  ISSUES=$((ISSUES + 1))
else
  echo "   ✅ No sensitive .env files in git"
fi

# 3. Check for console.log in production code
echo ""
echo "3. Checking for console.log in production..."
CONSOLE_LOG_COUNT=$(grep -rn "console\.log" --include="*.ts" --include="*.tsx" app/ lib/ 2>/dev/null | grep -v "node_modules" | grep -v ".test." | grep -v "security-log" | wc -l)
if [ "$CONSOLE_LOG_COUNT" -gt 0 ]; then
  echo "   ⚠️  $CONSOLE_LOG_COUNT console.log statements found (consider removing)"
  ISSUES=$((ISSUES + 1))
else
  echo "   ✅ No console.log in production code"
fi

# 4. Check for eval() usage
echo ""
echo "4. Checking for eval() usage..."
if grep -rn "eval(" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v "node_modules"; then
  echo "   ❌ eval() usage found (security risk)"
  ISSUES=$((ISSUES + 1))
else
  echo "   ✅ No eval() usage"
fi

# 5. Check for dangerouslySetInnerHTML
echo ""
echo "5. Checking for dangerouslySetInnerHTML..."
if grep -rn "dangerouslySetInnerHTML" --include="*.tsx" . 2>/dev/null | grep -v "node_modules"; then
  echo "   ❌ dangerouslySetInnerHTML usage found"
  ISSUES=$((ISSUES + 1))
else
  echo "   ✅ No dangerouslySetInnerHTML"
fi

# 6. Check npm audit
echo ""
echo "6. Running npm audit..."
if npm audit 2>/dev/null | grep -q "critical\|high"; then
  echo "   ❌ Critical/high vulnerabilities found"
  ISSUES=$((ISSUES + 1))
else
  echo "   ✅ No critical vulnerabilities"
fi

# 7. Check for source maps
echo ""
echo "7. Checking for source maps..."
if grep -rn "sourceMap" --include="*.json" tsconfig.json 2>/dev/null | grep -q "true"; then
  echo "   ⚠️  Source maps enabled in tsconfig"
  ISSUES=$((ISSUES + 1))
else
  echo "   ✅ Source maps properly configured"
fi

# 8. Check for open redirects
echo ""
echo "8. Checking for open redirect patterns..."
if grep -rn "window\.location.*=" --include="*.tsx" --include="*.ts" . 2>/dev/null | grep -v "node_modules" | grep -v "localhost"; then
  echo "   ⚠️  Potential open redirect patterns found"
  ISSUES=$((ISSUES + 1))
else
  echo "   ✅ No open redirect patterns"
fi

echo ""
echo "================================"
if [ $ISSUES -eq 0 ]; then
  echo "✅ Security audit passed!"
else
  echo "⚠️  Found $ISSUES potential issues"
fi
