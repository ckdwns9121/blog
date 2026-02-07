import { Octokit } from 'octokit';
import { getConfigFromEnv } from './config.js';
import { generateReview, formatReviewAsComment } from './review.js';
/**
 * Main function to review a pull request
 */
export async function reviewPullRequest(config) {
    const octokit = new Octokit({
        auth: config.githubToken
    });
    console.log(`PR #${config.prNumber} 가져오는 중... (${config.repoOwner}/${config.repoName})`);
    try {
        // Get PR details
        const { data: pr } = await octokit.rest.pulls.get({
            owner: config.repoOwner,
            repo: config.repoName,
            pull_number: config.prNumber
        });
        console.log(`PR 제목: ${pr.title}`);
        console.log(`PR 작성자: ${pr.user?.login}`);
        console.log(`변경된 파일: ${pr.changed_files}개`);
        // Get PR diff
        const diffResponse = await octokit.rest.pulls.get({
            owner: config.repoOwner,
            repo: config.repoName,
            pull_number: config.prNumber,
            mediaType: {
                format: 'diff'
            }
        });
        const diffText = diffResponse.data;
        console.log(`Diff 크기: ${diffText.length} 문자`);
        // Generate review using Claude
        console.log('Claude로 리뷰 생성 중...');
        const { review, fileComments } = await generateReview(diffText, pr.title, pr.body || '', config);
        console.log(`리뷰 생성 완료:`);
        console.log(`  - 우려사항: ${review.concerns.length}개`);
        console.log(`  - 제안사항: ${review.suggestions.length}개`);
        console.log(`  - 긍정적 측면: ${review.positives.length}개`);
        console.log(`  - 파일별 코멘트: ${fileComments.length}개`);
        // Post review as a comment
        const commentBody = formatReviewAsComment(review);
        console.log('리뷰 코멘트 게시 중...');
        await octokit.rest.issues.createComment({
            owner: config.repoOwner,
            repo: config.repoName,
            issue_number: config.prNumber,
            body: commentBody
        });
        console.log('✅ 리뷰 코멘트 게시 완료!');
        // Post file-level review comments
        if (fileComments.length > 0) {
            console.log(`파일별 코멘트 ${fileComments.length}개 게시 중...`);
            await postFileComments(octokit, config, pr.head.sha || '', fileComments);
        }
        console.log('✅ 모든 리뷰가 완료되었습니다!');
    }
    catch (error) {
        console.error('PR 리뷰 중 오류 발생:', error);
        throw error;
    }
}
/**
 * Post file-level review comments
 */
async function postFileComments(octokit, config, commitSha, comments) {
    for (const comment of comments) {
        try {
            // Try to find the line in the diff
            const { data: prFiles } = await octokit.rest.pulls.listFiles({
                owner: config.repoOwner,
                repo: config.repoName,
                pull_number: config.prNumber
            });
            const prFile = prFiles.find((f) => f.filename === comment.path);
            if (!prFile) {
                console.log(`  ⚠️  파일을 찾을 수 없음: ${comment.path}`);
                continue;
            }
            // Create review comment
            if (comment.line) {
                await octokit.rest.pulls.createReviewComment({
                    owner: config.repoOwner,
                    repo: config.repoName,
                    pull_number: config.prNumber,
                    commit_id: commitSha,
                    path: comment.path,
                    line: comment.line,
                    body: comment.body,
                    side: 'RIGHT'
                });
            }
            else {
                // No line specified, post as general file comment
                await octokit.rest.pulls.createReviewComment({
                    owner: config.repoOwner,
                    repo: config.repoName,
                    pull_number: config.prNumber,
                    commit_id: commitSha,
                    path: comment.path,
                    body: comment.body,
                    subject_type: 'file'
                });
            }
            console.log(`  ✅ 코멘트 게시: ${comment.path}`);
        }
        catch (error) {
            console.log(`  ⚠️  코멘트 게시 실패 (${comment.path}): ${error.message}`);
        }
    }
}
/**
 * CLI entry point
 */
export async function main() {
    try {
        const config = getConfigFromEnv();
        await reviewPullRequest(config);
    }
    catch (error) {
        console.error('PR 리뷰 실패:', error);
        process.exit(1);
    }
}
// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
