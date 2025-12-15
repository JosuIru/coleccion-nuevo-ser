#!/bin/bash

###############################################################################
# RUN ALL TESTS - Awakening Protocol
# Script para ejecutar toda la suite de tests
###############################################################################

set -e  # Exit on error

echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║       AWAKENING PROTOCOL - COMPLETE TEST SUITE                       ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

###############################################################################
# UNIT TESTS (Frontend)
###############################################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  1. UNIT TESTS - React Native${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd mobile-app

if npm run test:coverage; then
    echo -e "${GREEN}✅ Unit tests passed${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ Unit tests failed${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo -e "${YELLOW}📊 Coverage report generated at: mobile-app/coverage/lcov-report/index.html${NC}"
echo ""

cd ..

###############################################################################
# BACKEND TESTS (PHP)
###############################################################################

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  2. BACKEND TESTS - PHPUnit${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd api

# Check if composer is installed
if ! command -v composer &> /dev/null; then
    echo -e "${YELLOW}⚠️  Composer not found. Skipping backend tests.${NC}"
    echo -e "${YELLOW}   Install composer: https://getcomposer.org/${NC}"
else
    # Check if vendor exists
    if [ ! -d "vendor" ]; then
        echo -e "${YELLOW}📦 Installing PHP dependencies...${NC}"
        composer install
    fi

    if ./vendor/bin/phpunit; then
        echo -e "${GREEN}✅ Backend tests passed${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ Backend tests failed${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

cd ..

###############################################################################
# E2E TESTS (Optional)
###############################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  3. E2E TESTS - Detox (Optional)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Ask user if they want to run E2E tests
read -p "Run E2E tests? (Requires emulator/simulator running) [y/N]: " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd mobile-app

    # Ask platform
    echo "Select platform:"
    echo "  1) Android"
    echo "  2) iOS"
    echo "  3) Both"
    read -p "Choice [1-3]: " -n 1 -r PLATFORM_CHOICE
    echo ""

    case $PLATFORM_CHOICE in
        1)
            echo -e "${YELLOW}🤖 Running Android E2E tests...${NC}"
            if npm run test:e2e:android; then
                echo -e "${GREEN}✅ Android E2E tests passed${NC}"
                PASSED_TESTS=$((PASSED_TESTS + 1))
            else
                echo -e "${RED}❌ Android E2E tests failed${NC}"
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
            TOTAL_TESTS=$((TOTAL_TESTS + 1))
            ;;
        2)
            echo -e "${YELLOW}🍎 Running iOS E2E tests...${NC}"
            if npm run test:e2e:ios; then
                echo -e "${GREEN}✅ iOS E2E tests passed${NC}"
                PASSED_TESTS=$((PASSED_TESTS + 1))
            else
                echo -e "${RED}❌ iOS E2E tests failed${NC}"
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
            TOTAL_TESTS=$((TOTAL_TESTS + 1))
            ;;
        3)
            echo -e "${YELLOW}🤖 Running Android E2E tests...${NC}"
            if npm run test:e2e:android; then
                echo -e "${GREEN}✅ Android E2E tests passed${NC}"
                PASSED_TESTS=$((PASSED_TESTS + 1))
            else
                echo -e "${RED}❌ Android E2E tests failed${NC}"
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
            TOTAL_TESTS=$((TOTAL_TESTS + 1))

            echo ""
            echo -e "${YELLOW}🍎 Running iOS E2E tests...${NC}"
            if npm run test:e2e:ios; then
                echo -e "${GREEN}✅ iOS E2E tests passed${NC}"
                PASSED_TESTS=$((PASSED_TESTS + 1))
            else
                echo -e "${RED}❌ iOS E2E tests failed${NC}"
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
            TOTAL_TESTS=$((TOTAL_TESTS + 1))
            ;;
        *)
            echo -e "${YELLOW}⏭️  Skipping E2E tests${NC}"
            ;;
    esac

    cd ..
else
    echo -e "${YELLOW}⏭️  Skipping E2E tests${NC}"
fi

###############################################################################
# SUMMARY
###############################################################################

echo ""
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                         TEST SUMMARY                                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Calculate percentage
if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_PERCENTAGE=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
else
    PASS_PERCENTAGE=0
fi

echo "  Total Suites:    $TOTAL_TESTS"
echo -e "  ${GREEN}Passed:          $PASSED_TESTS${NC}"
echo -e "  ${RED}Failed:          $FAILED_TESTS${NC}"
echo "  ────────────────────────"
echo "  Success Rate:    $PASS_PERCENTAGE%"
echo ""

# Coverage summary
if [ -f "mobile-app/coverage/coverage-summary.json" ]; then
    echo -e "${YELLOW}📊 Coverage Summary:${NC}"
    echo "   Frontend: See mobile-app/coverage/lcov-report/index.html"
fi

if [ -f "api/coverage/index.html" ]; then
    echo "   Backend:  See api/coverage/index.html"
fi

echo ""

# Exit code
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All tests passed! 🎉${NC}"
    exit 0
fi
