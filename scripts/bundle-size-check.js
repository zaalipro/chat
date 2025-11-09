#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ✅ BUNDLE SIZE CONFIGURATION
const SIZE_LIMITS = {
  total: {
    warning: 1000 * 1024, // 1MB
    error: 1500 * 1024,   // 1.5MB
  },
  chunk: {
    warning: 500 * 1024,  // 500KB
    error: 800 * 1024,    // 800KB
  },
  vendor: {
    warning: 600 * 1024,  // 600KB
    error: 900 * 1024,    // 900KB
  }
};

// ✅ COLORS FOR CONSOLE OUTPUT
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// ✅ HELPER FUNCTIONS
const colorize = (text, color) => `${colors[color]}${text}${colors.reset}`;
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ✅ ANALYZE BUNDLE SIZE
const analyzeBundleSize = () => {
  const distPath = path.join(projectRoot, 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.error(colorize('❌ Build directory not found. Run `npm run build` first.', 'red'));
    process.exit(1);
  }

  console.log(colorize('\n📊 Bundle Size Analysis', 'bold'));
  console.log(colorize('=' .repeat(50), 'cyan'));

  const files = fs.readdirSync(distPath, { withFileTypes: true });
  const bundleFiles = files.filter(file => 
    file.isFile() && (file.name.endsWith('.js') || file.name.endsWith('.css'))
  );

  let totalSize = 0;
  const analysis = {
    total: 0,
    chunks: [],
    vendor: [],
    styles: [],
    largest: null
  };

  bundleFiles.forEach(file => {
    const filePath = path.join(distPath, file.name);
    const stats = fs.statSync(filePath);
    const size = stats.size;
    totalSize += size;

    const fileAnalysis = {
      name: file.name,
      size: size,
      sizeFormatted: formatBytes(size),
      type: getFileType(file.name)
    };

    analysis.total += size;
    analysis[fileAnalysis.type].push(fileAnalysis);

    if (!analysis.largest || size > analysis.largest.size) {
      analysis.largest = fileAnalysis;
    }
  });

  // ✅ DISPLAY RESULTS
  displayAnalysis(analysis);
  
  // ✅ CHECK SIZE LIMITS
  const warnings = checkSizeLimits(analysis);
  
  // ✅ GENERATE REPORT
  generateReport(analysis, warnings);
  
  return { analysis, warnings };
};

// ✅ DETERMINE FILE TYPE
const getFileType = (filename) => {
  if (filename.includes('vendor')) return 'vendor';
  if (filename.includes('chunk')) return 'chunks';
  if (filename.endsWith('.css')) return 'styles';
  return 'chunks';
};

// ✅ DISPLAY ANALYSIS RESULTS
const displayAnalysis = (analysis) => {
  console.log(colorize('\n📦 Total Bundle Size:', 'bold'), colorize(formatBytes(analysis.total), 'blue'));
  
  // Display by category
  Object.entries(analysis).forEach(([category, files]) => {
    if (Array.isArray(files) && files.length > 0) {
      console.log(colorize(`\n📁 ${category.toUpperCase()}:`, 'bold'));
      files.forEach(file => {
        const sizeColor = file.size > SIZE_LIMITS.chunk.warning ? 'yellow' : 'green';
        console.log(`  ${file.name}: ${colorize(file.sizeFormatted, sizeColor)}`);
      });
    }
  });

  // Display largest file
  if (analysis.largest) {
    console.log(colorize('\n🏆 Largest File:', 'bold'), 
      `${analysis.largest.name} (${colorize(analysis.largest.sizeFormatted, 'magenta')})`);
  }

  // Display compression estimates
  console.log(colorize('\n🗜️  Compression Estimates:', 'bold'));
  const gzippedEstimate = analysis.total * 0.3; // ~70% compression ratio
  const brotliEstimate = analysis.total * 0.25; // ~75% compression ratio
  console.log(`  Gzipped: ${colorize(formatBytes(gzippedEstimate), 'green')}`);
  console.log(`  Brotli:  ${colorize(formatBytes(brotliEstimate), 'green')}`);
};

// ✅ CHECK SIZE LIMITS
const checkSizeLimits = (analysis) => {
  const warnings = [];

  // Check total size
  if (analysis.total > SIZE_LIMITS.total.error) {
    warnings.push({
      type: 'error',
      message: `Total bundle size ${formatBytes(analysis.total)} exceeds limit of ${formatBytes(SIZE_LIMITS.total.error)}`,
      category: 'total'
    });
  } else if (analysis.total > SIZE_LIMITS.total.warning) {
    warnings.push({
      type: 'warning',
      message: `Total bundle size ${formatBytes(analysis.total)} approaching limit of ${formatBytes(SIZE_LIMITS.total.warning)}`,
      category: 'total'
    });
  }

  // Check individual chunks
  [...analysis.chunks, ...analysis.vendor].forEach(file => {
    const limit = file.name.includes('vendor') ? SIZE_LIMITS.vendor : SIZE_LIMITS.chunk;
    
    if (file.size > limit.error) {
      warnings.push({
        type: 'error',
        message: `${file.name} size ${formatBytes(file.size)} exceeds limit of ${formatBytes(limit.error)}`,
        category: 'chunk',
        file: file.name
      });
    } else if (file.size > limit.warning) {
      warnings.push({
        type: 'warning',
        message: `${file.name} size ${formatBytes(file.size)} approaching limit of ${formatBytes(limit.warning)}`,
        category: 'chunk',
        file: file.name
      });
    }
  });

  return warnings;
};

// ✅ GENERATE REPORT FILE
const generateReport = (analysis, warnings) => {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalSize: analysis.total,
      totalSizeFormatted: formatBytes(analysis.total),
      fileCount: analysis.chunks.length + analysis.vendor.length + analysis.styles.length,
      warnings: warnings.length,
      errors: warnings.filter(w => w.type === 'error').length
    },
    details: analysis,
    warnings: warnings,
    recommendations: generateRecommendations(analysis, warnings)
  };

  const reportPath = path.join(projectRoot, 'bundle-size-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(colorize(`\n📄 Report saved to: ${reportPath}`, 'cyan'));
};

// ✅ GENERATE OPTIMIZATION RECOMMENDATIONS
const generateRecommendations = (analysis, warnings) => {
  const recommendations = [];

  // Large files recommendations
  [...analysis.chunks, ...analysis.vendor].forEach(file => {
    if (file.size > SIZE_LIMITS.chunk.warning) {
      if (file.name.includes('vendor')) {
        recommendations.push({
          file: file.name,
          type: 'vendor',
          message: 'Consider splitting this vendor chunk or using dynamic imports',
          priority: 'high'
        });
      } else {
        recommendations.push({
          file: file.name,
          type: 'chunk',
          message: 'Consider code splitting or lazy loading for this chunk',
          priority: 'medium'
        });
      }
    }
  });

  // General recommendations
  if (analysis.total > SIZE_LIMITS.total.warning) {
    recommendations.push({
      type: 'general',
      message: 'Enable tree shaking and remove unused dependencies',
      priority: 'high'
    });
    
    recommendations.push({
      type: 'general',
      message: 'Implement compression (gzip/brotli) on server',
      priority: 'medium'
    });
  }

  // Moment.js specific recommendation
  const momentChunk = analysis.vendor.find(f => f.name.includes('moment'));
  if (momentChunk && momentChunk.size > 100 * 1024) { // 100KB
    recommendations.push({
      file: momentChunk.name,
      type: 'dependency',
      message: 'Replace moment.js with date-fns or day.js (80% smaller)',
      priority: 'high'
    });
  }

  return recommendations;
};

// ✅ DISPLAY WARNINGS
const displayWarnings = (warnings) => {
  if (warnings.length === 0) {
    console.log(colorize('\n✅ All size limits within acceptable range!', 'green'));
    return;
  }

  console.log(colorize('\n⚠️  Size Warnings:', 'bold'));
  warnings.forEach(warning => {
    const color = warning.type === 'error' ? 'red' : 'yellow';
    const icon = warning.type === 'error' ? '❌' : '⚠️';
    console.log(`${icon} ${colorize(warning.message, color)}`);
  });

  const errorCount = warnings.filter(w => w.type === 'error').length;
  if (errorCount > 0) {
    console.log(colorize(`\n❌ ${errorCount} error(s) found. Bundle size exceeds limits.`, 'red'));
    process.exit(1);
  }
};

// ✅ MAIN EXECUTION
const main = () => {
  try {
    const { analysis, warnings } = analyzeBundleSize();
    displayWarnings(warnings);
    
    console.log(colorize('\n🎉 Bundle size analysis completed!', 'green'));
  } catch (error) {
    console.error(colorize('❌ Error analyzing bundle size:', 'red'), error.message);
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { analyzeBundleSize, checkSizeLimits, generateRecommendations };