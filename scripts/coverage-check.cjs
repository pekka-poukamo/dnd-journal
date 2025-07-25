#!/usr/bin/env node

/**
 * Coverage Warning Script
 * 
 * Reads C8 coverage data and provides warnings for low coverage areas
 * without failing the build. Aligns with ADR-0005 (mandatory testing)
 * and ADR-0006 (no build tools).
 */

const fs = require('fs');
const path = require('path');

// Coverage thresholds
const THRESHOLDS = {
  lines: {
    target: 95,
    warning: 80,
    critical: 50
  },
  functions: {
    target: 90,
    warning: 70,
    critical: 40
  },
  branches: {
    target: 85,
    warning: 65,
    critical: 35
  }
};

// Coverage summary file path
const COVERAGE_SUMMARY_PATH = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

/**
 * Read and parse coverage summary
 */
const readCoverageSummary = () => {
  try {
    if (!fs.existsSync(COVERAGE_SUMMARY_PATH)) {
      console.warn('⚠️  Coverage summary not found. Run coverage first.');
      process.exit(0);
    }
    
    const data = fs.readFileSync(COVERAGE_SUMMARY_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading coverage summary:', error.message);
    process.exit(0);
  }
};

/**
 * Get coverage level for a percentage
 */
const getCoverageLevel = (percentage, metric) => {
  const thresholds = THRESHOLDS[metric];
  if (percentage >= thresholds.target) return 'excellent';
  if (percentage >= thresholds.warning) return 'good';
  if (percentage >= thresholds.critical) return 'warning';
  return 'critical';
};

/**
 * Get emoji for coverage level
 */
const getCoverageEmoji = (level) => {
  const emojis = {
    excellent: '🟢',
    good: '🟡',
    warning: '🟠',
    critical: '🔴'
  };
  return emojis[level] || '⚪';
};

/**
 * Format percentage with color coding
 */
const formatPercentage = (percentage, level) => {
  const rounded = Math.round(percentage * 100) / 100;
  return `${rounded.toFixed(2)}%`;
};

/**
 * Analyze file coverage and return warnings
 */
const analyzeFileCoverage = (files) => {
  const warnings = [];
  const critical = [];
  
  Object.entries(files).forEach(([filePath, coverage]) => {
    // Skip non-JS files and test files
    if (!filePath.includes('.js') || filePath.includes('test') || filePath.includes('coverage')) {
      return;
    }
    
    const fileName = path.basename(filePath);
    const linesCoverage = coverage.lines.pct;
    const functionsCoverage = coverage.functions.pct;
    const branchesCoverage = coverage.branches.pct;
    
    // Check for critical coverage issues
    if (linesCoverage < THRESHOLDS.lines.critical) {
      critical.push({
        file: fileName,
        type: 'lines',
        coverage: linesCoverage,
        uncovered: coverage.lines.total - coverage.lines.covered
      });
    }
    
    if (functionsCoverage < THRESHOLDS.functions.critical) {
      critical.push({
        file: fileName,
        type: 'functions', 
        coverage: functionsCoverage,
        uncovered: coverage.functions.total - coverage.functions.covered
      });
    }
    
    // Check for warning-level issues
    if (linesCoverage < THRESHOLDS.lines.warning && linesCoverage >= THRESHOLDS.lines.critical) {
      warnings.push({
        file: fileName,
        type: 'lines',
        coverage: linesCoverage,
        uncovered: coverage.lines.total - coverage.lines.covered
      });
    }
  });
  
  return { warnings, critical };
};

/**
 * Generate coverage report
 */
const generateCoverageReport = () => {
  const coverageData = readCoverageSummary();
  const totalCoverage = coverageData.total;
  
  console.log('\n🧪 D&D Journal Coverage Report\n');
  console.log('═'.repeat(50));
  
  // Overall coverage summary
  const linesLevel = getCoverageLevel(totalCoverage.lines.pct, 'lines');
  const functionsLevel = getCoverageLevel(totalCoverage.functions.pct, 'functions');
  const branchesLevel = getCoverageLevel(totalCoverage.branches.pct, 'branches');
  
  console.log(`\n📊 Overall Coverage:`);
  console.log(`${getCoverageEmoji(linesLevel)} Lines:     ${formatPercentage(totalCoverage.lines.pct, linesLevel)} (${totalCoverage.lines.covered}/${totalCoverage.lines.total})`);
  console.log(`${getCoverageEmoji(functionsLevel)} Functions: ${formatPercentage(totalCoverage.functions.pct, functionsLevel)} (${totalCoverage.functions.covered}/${totalCoverage.functions.total})`);
  console.log(`${getCoverageEmoji(branchesLevel)} Branches:  ${formatPercentage(totalCoverage.branches.pct, branchesLevel)} (${totalCoverage.branches.covered}/${totalCoverage.branches.total})`);
  
  // File-level analysis
  const { warnings, critical } = analyzeFileCoverage(coverageData);
  
  // Critical issues (ADR-0005 violations)
  if (critical.length > 0) {
    console.log(`\n🔴 Critical Coverage Issues (ADR-0005 Violations):`);
    console.log('─'.repeat(50));
    critical.forEach(issue => {
      console.log(`❌ ${issue.file}: ${issue.type} ${formatPercentage(issue.coverage)} (${issue.uncovered} uncovered)`);
    });
    console.log('\n💡 These files violate ADR-0005 "Mandatory Testing for All Code"');
  }
  
  // Warnings
  if (warnings.length > 0) {
    console.log(`\n🟡 Coverage Warnings:`);
    console.log('─'.repeat(50));
    warnings.forEach(warning => {
      console.log(`⚠️  ${warning.file}: ${warning.type} ${formatPercentage(warning.coverage)} (${warning.uncovered} uncovered)`);
    });
  }
  
  // Recommendations
  console.log(`\n📋 Recommendations:`);
  console.log('─'.repeat(50));
  
  if (totalCoverage.lines.pct < THRESHOLDS.lines.target) {
    const gap = THRESHOLDS.lines.target - totalCoverage.lines.pct;
    console.log(`📈 Improve line coverage by ${gap.toFixed(1)}% to reach 95% target`);
  }
  
  if (critical.length > 0) {
    console.log(`🎯 Priority: Address ${critical.length} critical coverage issue(s) first`);
  } else if (warnings.length > 0) {
    console.log(`🔧 Consider improving ${warnings.length} file(s) with low coverage`);
  } else {
    console.log(`✨ Coverage levels look good! Consider raising thresholds.`);
  }
  
  // ADR compliance check
  const isADRCompliant = totalCoverage.lines.pct >= THRESHOLDS.lines.target;
  if (!isADRCompliant) {
    console.log(`\n📜 ADR-0005 Compliance: ${isADRCompliant ? '✅ PASS' : '⚠️  NEEDS IMPROVEMENT'}`);
    console.log(`   Target: ${THRESHOLDS.lines.target}% line coverage`);
    console.log(`   Current: ${formatPercentage(totalCoverage.lines.pct)}`);
  }
  
  console.log('\n' + '═'.repeat(50));
  console.log('💡 Run "npm run coverage:html" for detailed coverage report');
  console.log('📖 See docs/adr/0005-mandatory-testing.md for testing guidelines');
  console.log('');
  
  // Exit successfully (warnings only, no failures)
  process.exit(0);
};

// Run the report
generateCoverageReport();