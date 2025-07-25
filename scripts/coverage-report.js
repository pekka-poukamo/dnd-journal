#!/usr/bin/env node

/**
 * Coverage Report Analyzer
 * Provides detailed coverage analysis for local development
 */

import fs from 'fs';
import path from 'path';

function getCoveragePercentage(coverage, type) {
  if (!coverage || !coverage[type]) return 0;
  const { covered = 0, total = 0 } = coverage[type];
  return total > 0 ? Math.round((covered / total) * 100) : 0;
}

function calculateCoverageFromStatements(fileCoverage) {
  if (!fileCoverage) return { lines: 0, functions: 0, branches: 0, statements: 0 };
  
  // Calculate statements coverage
  const statements = fileCoverage.s || {};
  const statementsCovered = Object.values(statements).filter(count => count > 0).length;
  const statementsTotal = Object.keys(statements).length;
  
  // Calculate functions coverage
  const functions = fileCoverage.f || {};
  const functionsCovered = Object.values(functions).filter(count => count > 0).length;
  const functionsTotal = Object.keys(functions).length;
  
  // Calculate branches coverage
  const branches = fileCoverage.b || {};
  let branchesCovered = 0;
  let branchesTotal = 0;
  for (const branchArray of Object.values(branches)) {
    if (Array.isArray(branchArray)) {
      branchesTotal += branchArray.length;
      branchesCovered += branchArray.filter(count => count > 0).length;
    }
  }
  
  // For lines, we'll use the same as statements as an approximation
  return {
    lines: statementsTotal > 0 ? Math.round((statementsCovered / statementsTotal) * 100) : 0,
    functions: functionsTotal > 0 ? Math.round((functionsCovered / functionsTotal) * 100) : 0,
    branches: branchesTotal > 0 ? Math.round((branchesCovered / branchesTotal) * 100) : 0,
    statements: statementsTotal > 0 ? Math.round((statementsCovered / statementsTotal) * 100) : 0
  };
}

function getUncoveredLines(coverage) {
  if (!coverage || !coverage.s || !coverage.statementMap) return [];
  
  const uncovered = [];
  for (const [statementId, count] of Object.entries(coverage.s)) {
    if (count === 0) {
      const statement = coverage.statementMap[statementId];
      if (statement) {
        uncovered.push({
          line: statement.start.line,
          statement: statementId
        });
      }
    }
  }
  
  return uncovered.sort((a, b) => a.line - b.line);
}

function analyzeFile(filePath, coverage) {
  const fileName = path.relative(process.cwd(), filePath);
  const coverageStats = calculateCoverageFromStatements(coverage);
  
  const uncoveredLines = getUncoveredLines(coverage);
  
  return {
    fileName,
    lines: coverageStats.lines,
    functions: coverageStats.functions,
    branches: coverageStats.branches,
    statements: coverageStats.statements,
    uncoveredLines,
    needsAttention: coverageStats.lines < 80 || coverageStats.functions < 80 || 
                   coverageStats.branches < 80 || coverageStats.statements < 80
  };
}

function generateReport() {
  const coverageFile = 'coverage/coverage-final.json';
  const summaryFile = 'coverage/coverage-summary.json';
  
  if (!fs.existsSync(coverageFile)) {
    console.log('❌ No coverage data found. Run "npm run coverage" first.');
    process.exit(1);
  }
  
  const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
  let summary = {};
  
  // Try to read summary file, if it doesn't exist, calculate from coverage data
  if (fs.existsSync(summaryFile)) {
    summary = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
  } else {
    // Calculate summary from coverage data
    const totals = {
      lines: { covered: 0, total: 0 },
      functions: { covered: 0, total: 0 },
      branches: { covered: 0, total: 0 },
      statements: { covered: 0, total: 0 }
    };
    
    for (const [filePath, fileCoverage] of Object.entries(coverage)) {
      if (filePath.includes('node_modules') || filePath.includes('test')) continue;
      
      const stats = calculateCoverageFromStatements(fileCoverage);
      
      // For aggregating, we need the raw counts, so approximate from percentages
      const statements = fileCoverage.s || {};
      const functions = fileCoverage.f || {};
      const branches = fileCoverage.b || {};
      
      const statementsTotal = Object.keys(statements).length;
      const functionsTotal = Object.keys(functions).length;
      let branchesTotal = 0;
      for (const branchArray of Object.values(branches)) {
        if (Array.isArray(branchArray)) {
          branchesTotal += branchArray.length;
        }
      }
      
      totals.statements.total += statementsTotal;
      totals.statements.covered += Math.round((stats.statements / 100) * statementsTotal);
      
      totals.functions.total += functionsTotal;
      totals.functions.covered += Math.round((stats.functions / 100) * functionsTotal);
      
      totals.branches.total += branchesTotal;
      totals.branches.covered += Math.round((stats.branches / 100) * branchesTotal);
      
      totals.lines.total += statementsTotal; // Using statements as lines approximation
      totals.lines.covered += Math.round((stats.lines / 100) * statementsTotal);
    }
    
    summary = { total: totals };
  }
  
  console.log('📊 Coverage Analysis Report');
  console.log('='.repeat(50));
  
  // Overall summary
  const total = summary.total || {};
  console.log('\n🌟 Overall Coverage:');
  console.log(`Lines:      ${getCoveragePercentage(total, 'lines')}%`);
  console.log(`Functions:  ${getCoveragePercentage(total, 'functions')}%`);
  console.log(`Branches:   ${getCoveragePercentage(total, 'branches')}%`);
  console.log(`Statements: ${getCoveragePercentage(total, 'statements')}%`);
  
  // Analyze individual files
  const fileAnalyses = [];
  for (const [filePath, fileCoverage] of Object.entries(coverage)) {
    if (filePath.includes('node_modules') || filePath.includes('test')) continue;
    fileAnalyses.push(analyzeFile(filePath, fileCoverage));
  }
  
  // Files needing attention
  const needsAttention = fileAnalyses.filter(f => f.needsAttention);
  if (needsAttention.length > 0) {
    console.log('\n🔍 Files Needing Attention (< 80% coverage):');
    console.log('File | Lines | Functions | Branches | Statements');
    console.log('-'.repeat(60));
    
    needsAttention.forEach(file => {
      console.log(`${file.fileName.padEnd(25)} | ${file.lines.toString().padStart(5)}% | ${file.functions.toString().padStart(9)}% | ${file.branches.toString().padStart(8)}% | ${file.statements.toString().padStart(10)}%`);
      
      if (file.uncoveredLines.length > 0) {
        const lines = file.uncoveredLines.slice(0, 10).map(u => u.line).join(', ');
        console.log(`  Uncovered lines: ${lines}${file.uncoveredLines.length > 10 ? '...' : ''}`);
      }
    });
  }
  
  // Well-covered files
  const wellCovered = fileAnalyses.filter(f => !f.needsAttention);
  if (wellCovered.length > 0) {
    console.log('\n✅ Well-Covered Files (≥ 80% coverage):');
    wellCovered.forEach(file => {
      console.log(`${file.fileName} - ${file.lines}% lines`);
    });
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (needsAttention.length > 0) {
    console.log('- Focus on adding tests for files with low coverage');
    console.log('- Pay special attention to uncovered lines shown above');
    console.log('- Consider adding edge case tests for better branch coverage');
  } else {
    console.log('- Great job! All files meet the coverage thresholds');
    console.log('- Consider adding more edge case tests to improve robustness');
  }
  
  console.log('\n📈 To improve coverage:');
  console.log('1. Run tests with --reporter=html to see detailed HTML reports');
  console.log('2. Open coverage/index.html in your browser for visual coverage');
  console.log('3. Focus on testing error conditions and edge cases');
  
  process.exit(needsAttention.length > 0 ? 1 : 0);
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  generateReport();
}

export { analyzeFile, getCoveragePercentage };