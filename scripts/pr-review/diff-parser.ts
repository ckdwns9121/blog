export interface ParsedDiffLine {
  line: number;      // 실제 파일에서의 라인 번호
  content: string;   // 라인 내용
  hunkStart: number; // hunk 시작 라인
}

export interface ParsedDiff {
  path: string;
  changedLines: ParsedDiffLine[];
}

/**
 * Git diff patch를 파싱하여 실제 변경된 라인 번호를 추출
 *
 * diff 포맷:
 * @@ -oldStart,oldCount +newStart,newCount @@ hunkHeader
 *  context line
 * +added line
 * -removed line
 *  context line
 */
export function parseDiffPatch(patch: string): ParsedDiffLine[] {
  const lines = patch.split('\n');
  const changedLines: ParsedDiffLine[] = [];

  let currentNewLine = 0; // 현재 hunk의 새로운 파일 시작 라인

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Hunk 헤더 감지: @@ -old,old +new,new @@ ...
    const hunkMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkMatch) {
      currentNewLine = parseInt(hunkMatch[1], 10) - 1; // 라인 번호는 1부터 시작
      continue;
    }

    // 추가된 라인 (+로 시작) - 첫 번째 문자가 +인지 확인
    // +++나 +++b/ 같은 헤더 라인은 제외
    if (line.startsWith('+') && !line.startsWith('+++')) {
      changedLines.push({
        line: currentNewLine + 1,
        content: line.substring(1), // + 제거
        hunkStart: currentNewLine + 1,
      });
      currentNewLine++;
    }
    // 삭제된 라인 (-로 시작)
    else if (line.startsWith('-') && !line.startsWith('---')) {
      // 삭제된 라인은 새로운 파일에 없으므로 라인 번호 증가 안 함
    }
    // 컨텍스트 라인 (공백으로 시작)
    else if (line.startsWith(' ') || line.startsWith('+') || line.startsWith('-')) {
      currentNewLine++;
    }
  }

  return changedLines;
}

export function buildAnnotatedDiff(
  path: string,
  patch: string,
  maxLength: number = 5000
): string {
  const changedLines = parseDiffPatch(patch);

  let result = `\n### ${path}\n`;
  result += `- Changed lines: ${changedLines.map((l) => `L${l.line}`).join(', ')}\n`;

  if (patch.length > maxLength) {
    // 너무 길면 변경된 라인 근처만 표시
    result += `\n\`\`\`diff\n`;

    const lines = patch.split('\n');
    let currentNewLine = 0;
    let buffer: string[] = [];
    let inHunk = false;

    for (const line of lines) {
      const hunkMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (hunkMatch) {
        currentNewLine = parseInt(hunkMatch[1], 10) - 1;
        if (buffer.length > 0) {
          result += buffer.join('\n') + '\n';
          buffer = [];
        }
        buffer.push(line);
        inHunk = true;
        continue;
      }

      if (inHunk) {
        buffer.push(line);

        // 추가된 라인인 경우
        if (line.startsWith('+') && !line.startsWith('+++')) {
          currentNewLine++;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          // 삭제된 라인
        } else if (line.startsWith(' ')) {
          currentNewLine++;
        }

        // 버퍼가 너무 크면 자르기
        if (buffer.join('\n').length > maxLength) {
          result += buffer.join('\n') + '\n... (truncated)\n';
          buffer = [];
          break;
        }
      }
    }

    if (buffer.length > 0) {
      result += buffer.join('\n');
    }

    result += `\n\`\`\`\n`;
  } else {
    result += `\n\`\`\`diff\n${patch}\n\`\`\`\n`;
  }

  // 변경된 라인 번호를 명시적으로 표시
  if (changedLines.length > 0) {
    result += `\n**Review these lines:** ${changedLines.map((l) => `${l.line}`).join(', ')}\n`;
  }

  return result;
}
