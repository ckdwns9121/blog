import { Octokit } from 'octokit';
import { getConfigFromEnv, ReviewConfig } from './config.js';
import { generateReview, formatReviewAsComment } from './review.js';

/**
 * Main function to review a pull request
 */
export async function reviewPullRequest(config: ReviewConfig): Promise<void> {
  const octokit = new Octokit({
    auth: config.githubToken
  });

  console.log(`Fetching PR #${config.prNumber} from ${config.repoOwner}/${config.repoName}...`);

  try {
    // Get PR details
    const { data: pr } = await octokit.rest.pulls.get({
      owner: config.repoOwner,
      repo: config.repoName,
      pull_number: config.prNumber
    });

    console.log(`PR Title: ${pr.title}`);
    console.log(`PR Author: ${pr.user?.login}`);
    console.log(`Changed files: ${pr.changed_files}`);

    // Get PR diff
    const diffResponse = await octokit.rest.pulls.get({
      owner: config.repoOwner,
      repo: config.repoName,
      pull_number: config.prNumber,
      mediaType: {
        format: 'diff'
      }
    });

    const diffText = diffResponse.data as unknown as string;
    console.log(`Diff size: ${diffText.length} characters`);

    // Generate review using Claude
    console.log('Generating review with Claude...');
    const review = await generateReview(
      diffText,
      pr.title,
      pr.body || '',
      config
    );

    console.log(`Review generated:`);
    console.log(`  - Concerns: ${review.concerns.length}`);
    console.log(`  - Suggestions: ${review.suggestions.length}`);
    console.log(`  - Positives: ${review.positives.length}`);

    // Post review as a comment
    const commentBody = formatReviewAsComment(review);
    console.log('Posting review comment...');

    await octokit.rest.issues.createComment({
      owner: config.repoOwner,
      repo: config.repoName,
      issue_number: config.prNumber,
      body: commentBody
    });

    console.log('✅ Review posted successfully!');
  } catch (error) {
    console.error('Error reviewing pull request:', error);
    throw error;
  }
}

/**
 * CLI entry point
 */
export async function main(): Promise<void> {
  try {
    const config = getConfigFromEnv();
    await reviewPullRequest(config);
  } catch (error) {
    console.error('Failed to review pull request:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
