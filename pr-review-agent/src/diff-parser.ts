export interface FileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  patch?: string;
}

export interface ParsedDiff {
  files: FileChange[];
  totalAdditions: number;
  totalDeletions: number;
}

/**
 * Parse GitHub diff response into structured format
 */
export function parseDiff(diffText: string): ParsedDiff {
  const files: FileChange[] = [];
  const lines = diffText.split('\n');
  let currentFile: Partial<FileChange> | null = null;
  let patchLines: string[] = [];
  let totalAdditions = 0;
  let totalDeletions = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect file header
    const fileMatch = line.match(/^diff --git a\/(.+?) b\/(.+?)$/);
    if (fileMatch) {
      // Save previous file if exists
      if (currentFile && currentFile.path) {
        currentFile.patch = patchLines.join('\n');
        files.push(currentFile as FileChange);
        totalAdditions += currentFile.additions || 0;
        totalDeletions += currentFile.deletions || 0;
      }

      // Start new file
      patchLines = [];
      currentFile = {
        path: fileMatch[2],
        status: 'modified',
        additions: 0,
        deletions: 0
      };
      continue;
    }

    // Detect file status
    if (line.startsWith('new file mode')) {
      if (currentFile) currentFile.status = 'added';
    } else if (line.startsWith('deleted file mode')) {
      if (currentFile) currentFile.status = 'deleted';
    } else if (line.startsWith('rename from')) {
      if (currentFile) currentFile.status = 'renamed';
    }

    // Count additions and deletions
    if (line.startsWith('+') && !line.startsWith('+++')) {
      if (currentFile) currentFile.additions = (currentFile.additions || 0) + 1;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      if (currentFile) currentFile.deletions = (currentFile.deletions || 0) + 1;
    }

    // Collect patch lines
    if (currentFile && (line.startsWith('+') || line.startsWith('-') || line.startsWith(' ') || line.startsWith('@@'))) {
      patchLines.push(line);
    }
  }

  // Don't forget the last file
  if (currentFile && currentFile.path) {
    currentFile.patch = patchLines.join('\n');
    files.push(currentFile as FileChange);
    totalAdditions += currentFile.additions || 0;
    totalDeletions += currentFile.deletions || 0;
  }

  return { files, totalAdditions, totalDeletions };
}

/**
 * Format diff for Claude analysis
 */
export function formatDiffForReview(parsedDiff: ParsedDiff): string {
  let result = `# Pull Request Diff Summary\n\n`;
  result += `**Files Changed:** ${parsedDiff.files.length}\n`;
  result += `**Total Additions:** +${parsedDiff.totalAdditions}\n`;
  result += `**Total Deletions:** -${parsedDiff.totalDeletions}\n\n`;

  for (const file of parsedDiff.files) {
    result += `## ${file.path}\n`;
    result += `**Status:** ${file.status} | `;
    result += `**Changes:** +${file.additions} -${file.deletions}\n\n`;

    if (file.patch) {
      // Limit patch size to avoid token limits
      const maxPatchLines = 200;
      const patchLines = file.patch.split('\n');
      if (patchLines.length > maxPatchLines) {
        result += `...\n(Showing first ${maxPatchLines} of ${patchLines.length} lines)\n...\n`;
        result += patchLines.slice(0, maxPatchLines).join('\n') + '\n';
      } else {
        result += `${file.patch}\n`;
      }
    }
    result += '\n---\n\n';
  }

  return result;
}
