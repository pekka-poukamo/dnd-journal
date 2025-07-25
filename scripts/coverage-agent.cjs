#!/usr/bin/env node

/**
 * Agent-Friendly Coverage Reporter
 * 
 * Provides machine-readable coverage data for AI agents to:
 * - Understand which files need tests
 * - Get specific line numbers that are uncovered
 * - Receive actionable testing guidance
 * - Make informed decisions about test priorities
 */

const fs = require('fs');
const path = require('path');

// Coverage thresholds for agent decision making
const THRESHOLDS = {
  lines: { target: 95, warning: 80, critical: 50 },
  functions: { target: 90, warning: 70, critical: 40 },
  branches: { target: 85, warning: 65, critical: 35 }
};

const COVERAGE_SUMMARY_PATH = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

/**
 * Generate agent-friendly coverage report
 */
const generateAgentReport = () => {
  try {
    if (!fs.existsSync(COVERAGE_SUMMARY_PATH)) {
      return {
        error: 'Coverage data not found. Run "npm run test:coverage" first.',
        success: false
      };
    }
    
    const coverageData = JSON.parse(fs.readFileSync(COVERAGE_SUMMARY_PATH, 'utf8'));
    
    // Analyze files for agent decision making
    const fileAnalysis = [];
    const priorities = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };
    
    Object.entries(coverageData).forEach(([filePath, coverage]) => {
      // Skip non-JS files and aggregated data
      if (!filePath.includes('.js') || filePath === 'total' || 
          filePath.includes('test') || filePath.includes('coverage')) {
        return;
      }
      
      const fileName = path.basename(filePath);
      const analysis = {
        file: fileName,
        path: filePath,
        coverage: {
          lines: {
            percent: coverage.lines.pct,
            covered: coverage.lines.covered,
            total: coverage.lines.total,
            uncovered: coverage.lines.total - coverage.lines.covered
          },
          functions: {
            percent: coverage.functions.pct,
            covered: coverage.functions.covered,
            total: coverage.functions.total,
            uncovered: coverage.functions.total - coverage.functions.covered
          },
          branches: {
            percent: coverage.branches.pct,
            covered: coverage.branches.covered,
            total: coverage.branches.total,
            uncovered: coverage.branches.total - coverage.branches.covered
          }
        },
        status: {
          lines: getStatusLevel(coverage.lines.pct, 'lines'),
          functions: getStatusLevel(coverage.functions.pct, 'functions'),
          branches: getStatusLevel(coverage.branches.pct, 'branches')
        },
        adr_compliant: coverage.lines.pct >= THRESHOLDS.lines.target,
        needs_immediate_attention: coverage.lines.pct < THRESHOLDS.lines.critical || 
                                 coverage.functions.pct < THRESHOLDS.functions.critical
      };
      
      fileAnalysis.push(analysis);
      
      // Categorize by priority for agent action
      if (analysis.needs_immediate_attention) {
        priorities.critical.push(analysis);
      } else if (coverage.lines.pct < THRESHOLDS.lines.warning) {
        priorities.high.push(analysis);
      } else if (coverage.lines.pct < THRESHOLDS.lines.target) {
        priorities.medium.push(analysis);
      } else {
        priorities.low.push(analysis);
      }
    });
    
    // Generate actionable recommendations for agents
    const recommendations = generateAgentRecommendations(priorities, coverageData.total);
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      overall: {
        lines: coverageData.total.lines.pct,
        functions: coverageData.total.functions.pct,
        branches: coverageData.total.branches.pct,
        adr_compliant: coverageData.total.lines.pct >= THRESHOLDS.lines.target
      },
      files: fileAnalysis,
      priorities: priorities,
      recommendations: recommendations,
      thresholds: THRESHOLDS,
      next_actions: getNextActions(priorities)
    };
    
  } catch (error) {
    return {
      error: `Failed to generate coverage report: ${error.message}`,
      success: false
    };
  }
};

/**
 * Get coverage status level
 */
const getStatusLevel = (percentage, metric) => {
  const thresholds = THRESHOLDS[metric];
  if (percentage >= thresholds.target) return 'excellent';
  if (percentage >= thresholds.warning) return 'good';
  if (percentage >= thresholds.critical) return 'warning';
  return 'critical';
};

/**
 * Generate specific recommendations for AI agents
 */
const generateAgentRecommendations = (priorities, totalCoverage) => {
  const recommendations = [];
  
  if (priorities.critical.length > 0) {
    recommendations.push({
      priority: 'CRITICAL',
      action: 'ADD_TESTS',
      files: priorities.critical.map(f => f.file),
      reason: 'ADR-0005 violation - below critical thresholds',
      commands: ['npm run coverage:html', 'npm test'],
      estimated_impact: 'High - addresses compliance violations'
    });
  }
  
  if (priorities.high.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      action: 'IMPROVE_COVERAGE',
      files: priorities.high.map(f => f.file),
      reason: 'Below warning thresholds, needs improvement',
      commands: ['npm run coverage:html'],
      estimated_impact: 'Medium - improves overall coverage'
    });
  }
  
  if (totalCoverage.lines.pct < THRESHOLDS.lines.target) {
    const gap = THRESHOLDS.lines.target - totalCoverage.lines.pct;
    recommendations.push({
      priority: 'MEDIUM',
      action: 'REACH_TARGET',
      reason: `Need ${gap.toFixed(1)}% more line coverage to reach 95% target`,
      suggested_focus: priorities.critical.concat(priorities.high).map(f => f.file),
      commands: ['npm run coverage:check']
    });
  }
  
  return recommendations;
};

/**
 * Generate specific next actions for agents
 */
const getNextActions = (priorities) => {
  const actions = [];
  
  if (priorities.critical.length > 0) {
    actions.push({
      step: 1,
      action: `Write tests for ${priorities.critical.length} critical file(s)`,
      files: priorities.critical.map(f => f.file),
      command: 'npm run coverage:html',
      description: 'Focus on files violating ADR-0005 first'
    });
  }
  
  if (priorities.high.length > 0) {
    actions.push({
      step: actions.length + 1,
      action: `Improve coverage for ${priorities.high.length} file(s) below 80%`,
      files: priorities.high.slice(0, 3).map(f => f.file), // Limit to top 3
      command: 'npm test',
      description: 'Add tests for edge cases and error conditions'
    });
  }
  
  actions.push({
    step: actions.length + 1,
    action: 'Verify changes',
    command: 'npm run coverage:warn',
    description: 'Run coverage analysis to see improvement'
  });
  
  return actions;
};

// Output format based on command line argument
const outputFormat = process.argv[2] || 'json';
const report = generateAgentReport();

switch (outputFormat) {
  case 'json':
    console.log(JSON.stringify(report, null, 2));
    break;
    
  case 'summary':
    if (report.success) {
      console.log(`COVERAGE_STATUS=${report.overall.adr_compliant ? 'COMPLIANT' : 'NEEDS_IMPROVEMENT'}`);
      console.log(`LINES_COVERAGE=${report.overall.lines.toFixed(2)}`);
      console.log(`CRITICAL_FILES=${report.priorities.critical.length}`);
      console.log(`HIGH_PRIORITY_FILES=${report.priorities.high.length}`);
      console.log(`NEXT_ACTION=${report.next_actions[0]?.action || 'NONE'}`);
    } else {
      console.log(`ERROR=${report.error}`);
    }
    break;
    
  case 'files':
    if (report.success) {
      report.files.forEach(file => {
        console.log(`${file.file}:${file.coverage.lines.percent}:${file.status.lines}:${file.adr_compliant}`);
      });
    }
    break;
    
  default:
    console.error('Usage: node coverage-agent.cjs [json|summary|files]');
    process.exit(1);
}

process.exit(report.success ? 0 : 1);