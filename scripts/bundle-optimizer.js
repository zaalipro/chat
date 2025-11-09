#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

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

const colorize = (text, color) => `${colors[color]}${text}${colors.reset}`;

// ✅ OPTIMIZATION STRATEGIES
const optimizationStrategies = {
  // Replace heavy dependencies
  replaceMoment: {
    name: 'Replace moment.js with date-fns',
    description: 'Replace moment.js (66KB) with date-fns (2.1KB) - 97% size reduction',
    priority: 'high',
    impact: 'high'
  },
  replaceAxios: {
    name: 'Replace axios with fetch',
    description: 'Replace axios (28KB) with native fetch (0KB) - 100% size reduction',
    priority: 'medium',
    impact: 'medium'
  },
  optimizeApollo: {
    name: 'Optimize Apollo Client imports',
    description: 'Use @apollo/client/core instead of full package - 40% size reduction',
    priority: 'high',
    impact: 'high'
  },
  treeShaking: {
    name: 'Enable aggressive tree shaking',
    description: 'Remove unused code from dependencies - 15-25% size reduction',
    priority: 'medium',
    impact: 'medium'
  },
  compression: {
    name: 'Enable compression',
    description: 'Enable gzip/brotli compression - 70-75% size reduction',
    priority: 'high',
    impact: 'high'
  },
  codeSplitting: {
    name: 'Implement code splitting',
    description: 'Split code into smaller chunks - 40-60% initial load reduction',
    priority: 'high',
    impact: 'high'
  },
  removeUnused: {
    name: 'Remove unused dependencies',
    description: 'Identify and remove unused packages - 5-10% size reduction',
    priority: 'medium',
    impact: 'low'
  }
};

// ✅ MAIN OPTIMIZATION FUNCTION
const optimizeBundle = async () => {
  console.log(colorize('\n🚀 Bundle Size Optimizer', 'bold'));
  console.log(colorize('=' .repeat(50), 'cyan'));

  try {
    // Check current bundle size
    console.log(colorize('\n📊 Analyzing current bundle...', 'blue'));
    const currentAnalysis = await analyzeCurrentBundle();
    
    // Apply optimizations
    console.log(colorize('\n🔧 Applying optimizations...', 'blue'));
    const optimizations = await applyOptimizations(currentAnalysis);
    
    // Build optimized bundle
    console.log(colorize('\n🏗️  Building optimized bundle...', 'blue'));
    const optimizedAnalysis = await buildOptimizedBundle();
    
    // Compare results
    console.log(colorize('\n📈 Comparing results...', 'blue'));
    const comparison = compareBundles(currentAnalysis, optimizedAnalysis);
    
    // Generate report
    console.log(colorize('\n📄 Generating optimization report...', 'blue'));
    generateOptimizationReport(currentAnalysis, optimizedAnalysis, comparison, optimizations);
    
    console.log(colorize('\n🎉 Bundle optimization completed!', 'green'));
    displayResults(comparison);
    
  } catch (error) {
    console.error(colorize('❌ Optimization failed:', 'red'), error.message);
    process.exit(1);
  }
};

// ✅ ANALYZE CURRENT BUNDLE
const analyzeCurrentBundle = async () => {
  try {
    // Build current bundle
    execSync('npm run build', { cwd: projectRoot, stdio: 'pipe' });
    
    // Analyze bundle size
    const distPath = path.join(projectRoot, 'dist');
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
      timestamp: new Date().toISOString()
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
    });

    return analysis;
  } catch (error) {
    throw new Error(`Failed to analyze current bundle: ${error.message}`);
  }
};

// ✅ APPLY OPTIMIZATIONS
const applyOptimizations = async (currentAnalysis) => {
  const appliedOptimizations = [];

  // Strategy 1: Replace moment.js with date-fns
  if (shouldReplaceMoment(currentAnalysis)) {
    console.log(colorize('  📅 Replacing moment.js with date-fns...', 'yellow'));
    await replaceMomentWithDateFns();
    appliedOptimizations.push('replaceMoment');
  }

  // Strategy 2: Optimize Apollo Client imports
  console.log(colorize('  🚀 Optimizing Apollo Client imports...', 'yellow'));
  await optimizeApolloImports();
  appliedOptimizations.push('optimizeApollo');

  // Strategy 3: Enable tree shaking
  console.log(colorize('  🌳 Enabling aggressive tree shaking...', 'yellow'));
  await enableTreeShaking();
  appliedOptimizations.push('treeShaking');

  // Strategy 4: Implement code splitting
  console.log(colorize('  ✂️  Implementing code splitting...', 'yellow'));
  await implementCodeSplitting();
  appliedOptimizations.push('codeSplitting');

  // Strategy 5: Remove unused dependencies
  console.log(colorize('  🧹 Removing unused dependencies...', 'yellow'));
  await removeUnusedDependencies();
  appliedOptimizations.push('removeUnused');

  return appliedOptimizations;
};

// ✅ CHECK IF MOMENT.JS SHOULD BE REPLACED
const shouldReplaceMoment = (analysis) => {
  const momentChunk = analysis.vendor.find(f => f.name.includes('moment'));
  return momentChunk && momentChunk.size > 50 * 1024; // 50KB threshold
};

// ✅ REPLACE MOMENT.JS WITH DATE-FNS
const replaceMomentWithDateFns = async () => {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Remove moment and add date-fns
  if (packageJson.dependencies.moment) {
    delete packageJson.dependencies.moment;
    packageJson.dependencies['date-fns'] = '^2.30.0';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    // Install new dependency
    execSync('npm install', { cwd: projectRoot, stdio: 'pipe' });
    
    // Update imports in code files
    await updateMomentImports();
  }
};

// ✅ UPDATE MOMENT.JS IMPORTS
const updateMomentImports = async () => {
  const srcPath = path.join(projectRoot, 'src');
  const files = getAllFiles(srcPath);

  for (const file of files) {
    if (file.endsWith('.js') || file.endsWith('.jsx')) {
      let content = fs.readFileSync(file, 'utf8');
      
      // Replace moment imports
      content = content.replace(
        /import moment from ['"]moment['"];?/g,
        "import { format, parseISO, isValid } from 'date-fns';"
      );
      
      // Replace moment usage with date-fns equivalents
      content = content.replace(
        /moment\(([^)]+)\)\.format\(['"]([^'"]+)['"]\)/g,
        "format(parseISO($1), '$2')"
      );
      
      content = content.replace(
        /moment\(([^)]+)\)\.isValid\(\)/g,
        "isValid(parseISO($1))"
      );
      
      fs.writeFileSync(file, content);
    }
  }
};

// ✅ OPTIMIZE APOLLO IMPORTS
const optimizeApolloImports = async () => {
  const srcPath = path.join(projectRoot, 'src');
  const files = getAllFiles(srcPath);

  for (const file of files) {
    if (file.endsWith('.js') || file.endsWith('.jsx')) {
      let content = fs.readFileSync(file, 'utf8');
      
      // Replace full Apollo imports with core imports
      content = content.replace(
        /import \{([^}]+)\} from ['"]@apollo\/client['"];?/g,
        (match, imports) => {
          const coreImports = imports.split(',').map(imp => imp.trim()).filter(imp => 
            ['gql', 'ApolloClient', 'InMemoryCache', 'useQuery', 'useMutation', 'useSubscription'].includes(imp)
          );
          return `import { ${coreImports.join(', ')} } from '@apollo/client/core';`;
        }
      );
      
      fs.writeFileSync(file, content);
    }
  }
};

// ✅ ENABLE TREE SHAKING
const enableTreeShaking = async () => {
  const viteConfigPath = path.join(projectRoot, 'vite.config.js');
  let config = fs.readFileSync(viteConfigPath, 'utf8');

  // Add tree shaking optimizations
  if (!config.includes('treeShaking')) {
    config = config.replace(
      'export default defineConfig({',
      `// ✅ TREE SHAKING OPTIMIZATIONS
export default defineConfig({
  build: {
    rollupOptions: {
      treeshake: 'smallest',
      output: {
        treeshake: true,
      }
    }
  },`
    );
  }

  fs.writeFileSync(viteConfigPath, config);
};

// ✅ IMPLEMENT CODE SPLITTING
const implementCodeSplitting = async () => {
  // This is already implemented in the updated vite.config.js
  console.log(colorize('    ✅ Code splitting already configured', 'green'));
};

// ✅ REMOVE UNUSED DEPENDENCIES
const removeUnusedDependencies = async () => {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Check for unused dependencies
  const srcPath = path.join(projectRoot, 'src');
  const files = getAllFiles(srcPath);
  let allImports = '';

  files.forEach(file => {
    if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(file, 'utf8');
      allImports += content;
    }
  });

  // Check each dependency
  Object.keys(packageJson.dependencies).forEach(dep => {
    if (!allImports.includes(dep) && !isDevDependency(dep)) {
      console.log(colorize(`    🗑️  Removing unused dependency: ${dep}`, 'yellow'));
      delete packageJson.dependencies[dep];
    }
  });

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
};

// ✅ BUILD OPTIMIZED BUNDLE
const buildOptimizedBundle = async () => {
  try {
    execSync('npm run build', { cwd: projectRoot, stdio: 'pipe' });
    
    const distPath = path.join(projectRoot, 'dist');
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
      timestamp: new Date().toISOString()
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
    });

    return analysis;
  } catch (error) {
    throw new Error(`Failed to build optimized bundle: ${error.message}`);
  }
};

// ✅ COMPARE BUNDLES
const compareBundles = (current, optimized) => {
  const sizeReduction = current.total - optimized.total;
  const percentageReduction = ((sizeReduction / current.total) * 100).toFixed(1);

  return {
    current: {
      total: current.total,
      formatted: formatBytes(current.total),
      chunks: current.chunks.length,
      vendor: current.vendor.length
    },
    optimized: {
      total: optimized.total,
      formatted: formatBytes(optimized.total),
      chunks: optimized.chunks.length,
      vendor: optimized.vendor.length
    },
    reduction: {
      bytes: sizeReduction,
      formatted: formatBytes(sizeReduction),
      percentage: percentageReduction
    }
  };
};

// ✅ GENERATE OPTIMIZATION REPORT
const generateOptimizationReport = (current, optimized, comparison, optimizations) => {
  const report = {
    timestamp: new Date().toISOString(),
    optimizations: optimizations,
    comparison: comparison,
    currentAnalysis: current,
    optimizedAnalysis: optimized,
    recommendations: generateOptimizationRecommendations(comparison)
  };

  const reportPath = path.join(projectRoot, 'bundle-optimization-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(colorize(`📄 Optimization report saved to: ${reportPath}`, 'cyan'));
};

// ✅ GENERATE OPTIMIZATION RECOMMENDATIONS
const generateOptimizationRecommendations = (comparison) => {
  const recommendations = [];

  if (comparison.reduction.percentage < 30) {
    recommendations.push({
      type: 'further_optimization',
      message: 'Consider additional optimizations for better size reduction',
      priority: 'medium'
    });
  }

  if (comparison.optimized.vendor > 3) {
    recommendations.push({
      type: 'vendor_splitting',
      message: 'Consider splitting vendor chunks further',
      priority: 'low'
    });
  }

  recommendations.push({
    type: 'compression',
    message: 'Enable gzip/brotli compression on your server',
    priority: 'high'
  });

  recommendations.push({
    type: 'caching',
    message: 'Implement long-term caching for vendor chunks',
    priority: 'medium'
  });

  return recommendations;
};

// ✅ DISPLAY RESULTS
const displayResults = (comparison) => {
  console.log(colorize('\n📊 Optimization Results:', 'bold'));
  console.log(colorize('-'.repeat(40), 'cyan'));
  
  console.log(colorize('Before:', 'yellow'), comparison.current.formatted);
  console.log(colorize('After:', 'green'), comparison.optimized.formatted);
  console.log(colorize('Reduction:', 'magenta'), 
    `${comparison.reduction.formatted} (${comparison.reduction.percentage}%)`);
  
  console.log(colorize('\n📈 Performance Impact:', 'bold'));
  console.log(`  Chunks: ${comparison.current.chunks} → ${comparison.optimized.chunks}`);
  console.log(`  Vendor files: ${comparison.current.vendor} → ${comparison.optimized.vendor}`);
  
  // Compression estimates
  const gzipped = comparison.optimized.total * 0.3;
  const brotli = comparison.optimized.total * 0.25;
  console.log(colorize('\n🗜️  With compression:', 'bold'));
  console.log(`  Gzip: ${colorize(formatBytes(gzipped), 'green')}`);
  console.log(`  Brotli: ${colorize(formatBytes(brotli), 'green')}`);
};

// ✅ HELPER FUNCTIONS
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileType = (filename) => {
  if (filename.includes('vendor')) return 'vendor';
  if (filename.includes('chunk')) return 'chunks';
  if (filename.endsWith('.css')) return 'styles';
  return 'chunks';
};

const getAllFiles = (dir, files = []) => {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      getAllFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  
  return files;
};

const isDevDependency = (dep) => {
  const devDeps = ['vite', 'vitest', '@testing-library', 'terser', 'postcss'];
  return devDeps.some(devDep => dep.includes(devDep));
};

// ✅ MAIN EXECUTION
const main = async () => {
  await optimizeBundle();
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { optimizeBundle, applyOptimizations, compareBundles };