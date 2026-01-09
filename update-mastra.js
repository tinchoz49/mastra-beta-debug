#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const packages = [
  '@mastra/ai-sdk',
  '@mastra/core',
  '@mastra/evals',
  '@mastra/hono',
  '@mastra/loggers',
  '@mastra/memory',
  '@mastra/observability',
  '@mastra/pg',
  '@mastra/server',
  'mastra',
]

async function getLatestBetaVersion(packageName) {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`)
    if (!response.ok) {
      return `Error: HTTP ${response.status}`
    }
    const data = await response.json()
    const versions = Object.keys(data.versions || {})

    // Filter beta versions
    const betaVersions = versions.filter((v) => v.includes('beta'))

    if (betaVersions.length === 0) {
      return null
    }

    // Sort versions properly
    betaVersions.sort((a, b) => {
      // Compare base version first
      const aBase = a
      const bBase = b
      const baseCompare = aBase.localeCompare(bBase, undefined, { numeric: true, sensitivity: 'base' })

      if (baseCompare !== 0) {
        return baseCompare
      }

      return b.localeCompare(a)
    })

    return betaVersions[betaVersions.length - 1] || null
  } catch (error) {
    return `Error: ${error.message}`
  }
}

async function main() {
  const packageJsonPath = path.join(__dirname, './package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

  // Extract current versions from package.json
  const currentVersions = {}
  for (const pkg of packages) {
    if (packageJson.dependencies?.[pkg]) {
      currentVersions[pkg] = packageJson.dependencies[pkg]
    }
  }

  console.log('Checking latest beta versions for Mastra packages...\n')
  console.log('Package'.padEnd(30), 'Current'.padEnd(20), 'Latest Beta'.padEnd(20), 'Status')
  console.log('-'.repeat(90))

  const updates = []
  let hasUpdates = false

  for (const pkg of packages) {
    const current = currentVersions[pkg]
    if (!current) {
      console.log(pkg.padEnd(30), 'Not found'.padEnd(20), 'N/A'.padEnd(20), '⚠️  Not in dependencies')
      continue
    }

    const latest = await getLatestBetaVersion(pkg)

    let status = ''
    if (latest && typeof latest === 'string' && latest.startsWith('Error')) {
      status = '❌ Error'
    } else if (latest && latest !== current) {
      status = '⚠️  UPDATE AVAILABLE'
      hasUpdates = true
      updates.push({ pkg, current, latest })
      // Update package.json
      packageJson.dependencies[pkg] = latest
    } else if (latest === current) {
      status = '✅ Up to date'
    } else {
      status = '❓ Unknown'
    }

    console.log(pkg.padEnd(30), current.padEnd(20), (latest || 'N/A').padEnd(20), status)
  }

  if (hasUpdates) {
    console.log('\n' + '='.repeat(90))
    console.log('Updating package.json with latest beta versions...\n')

    for (const update of updates) {
      console.log(`  ${update.pkg}: ${update.current} → ${update.latest}`)
    }

    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8')

    console.log('\n✅ package.json updated successfully!')
    console.log('Run "bun install" to install the updated packages.')
  } else {
    console.log('\n✅ All packages are up to date!')
  }
}

main().catch(console.error)
